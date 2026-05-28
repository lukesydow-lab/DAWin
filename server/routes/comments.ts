/**
 * server/routes/comments.ts
 *
 * Comment endpoints for FR-06 — Session Communication + Inline Comments.
 * See ADR-003 for anchor model, role enforcement rules, and WS broadcast contract.
 *
 * Endpoints:
 *   POST   /api/v1/sessions/:sessionId/comments                         → 201 { data: SessionComment }
 *   GET    /api/v1/sessions/:sessionId/comments                         → 200 { data: SessionComment[] }
 *   DELETE /api/v1/sessions/:sessionId/comments/:commentId              → 204
 *   PATCH  /api/v1/sessions/:sessionId/comments/:commentId/resolve      → 200 { data: SessionComment }
 *   PATCH  /api/v1/sessions/:sessionId/comments/:commentId/reopen       → 200 { data: SessionComment }
 *   POST   /api/v1/sessions/:sessionId/comments/:commentId/replies      → 201 { data: SessionComment }
 *
 * Role enforcement (ADR-003, Decision 6):
 *   viewer    → 403 on all mutation endpoints (create, reply, resolve, reopen, delete)
 *   owner     → all operations including delete of any comment
 *   collaborator → all mutation operations; delete only their own comments
 *
 * WS broadcast: mutations call broadcastCommentEvent after writing to the store.
 * The broadcast goes to ALL WS clients in the session. The REST response is the
 * ack for the originating client — there is no echo back through WS.
 *
 * Sprint 5: persistence delegated to fastify.storage (StorageAdapter).
 * The volatile in-memory state (clients, trackLocks, transport) stays in store.ts
 * and is used only by ws/handler.ts — not touched here.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type {
  SessionComment,
  CommentAnchor,
  CommentAnchorType,
} from "../types.js";
import { verifyToken } from "../jwt.js";
import { broadcastCommentEvent } from "../ws/handler.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract and verify the Bearer token from the Authorization header.
 *  Returns the decoded claims on success, or null if missing/invalid. */
async function extractClaims(request: FastifyRequest) {
  const authHeader = request.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

/** Type guard: check that a value is a non-null plain object. */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Validate a CommentAnchor object against ADR-003 invariants.
 *  Returns a string describing the violation, or null if valid. */
function validateAnchor(anchor: unknown): string | null {
  if (!isRecord(anchor)) return "anchor must be an object";

  const validTypes: CommentAnchorType[] = [
    "timeline",
    "timeRange",
    "track",
    "clip",
    "trackMoment",
  ];
  const anchorType = anchor["anchorType"];
  if (typeof anchorType !== "string" || !validTypes.includes(anchorType as CommentAnchorType)) {
    return `anchorType must be one of: ${validTypes.join(", ")}`;
  }

  const type = anchorType as CommentAnchorType;

  if (type === "timeline" || type === "timeRange" || type === "trackMoment") {
    if (typeof anchor["startBar"] !== "number") {
      return `startBar is required for anchorType '${type}'`;
    }
  }
  if (type === "timeRange") {
    if (typeof anchor["endBar"] !== "number") {
      return "endBar is required for anchorType 'timeRange'";
    }
    if ((anchor["endBar"] as number) <= (anchor["startBar"] as number)) {
      return "endBar must be strictly greater than startBar";
    }
  }
  if (type === "track" || type === "clip" || type === "trackMoment") {
    if (typeof anchor["trackId"] !== "string" || !anchor["trackId"]) {
      return `trackId is required for anchorType '${type}'`;
    }
  }
  if (type === "clip") {
    if (typeof anchor["clipId"] !== "string" || !anchor["clipId"]) {
      return "clipId is required for anchorType 'clip'";
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Route params / body types
// ---------------------------------------------------------------------------

interface SessionParams {
  sessionId: string;
}

interface CommentParams extends SessionParams {
  commentId: string;
}

interface CreateCommentBody {
  body: string;
  anchor: CommentAnchor;
}

interface CreateReplyBody {
  body: string;
}

// ---------------------------------------------------------------------------
// Route plugin
// ---------------------------------------------------------------------------

export async function commentRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /api/v1/sessions/:sessionId/comments
   *
   * Create a new comment anchored to a timeline position, track, or clip.
   * Requires owner or collaborator role (viewers → 403).
   * Body: { body: string, anchor: CommentAnchor }
   * Response 201: { data: SessionComment }
   */
  fastify.post(
    "/api/v1/sessions/:sessionId/comments",
    async (
      request: FastifyRequest<{ Params: SessionParams; Body: CreateCommentBody }>,
      reply: FastifyReply
    ) => {
      const claims = await extractClaims(request);
      if (!claims) {
        return reply.code(401).send({ error: "unauthorized", message: "Missing or invalid Bearer token" });
      }
      if (claims.role === "viewer") {
        return reply.code(403).send({ error: "forbidden", message: "Viewers cannot create comments" });
      }

      const { sessionId } = request.params;
      const reqBody = request.body;

      if (!reqBody || typeof reqBody.body !== "string" || !reqBody.body.trim()) {
        return reply.code(400).send({ error: "bad_request", message: "body is required" });
      }

      const anchorError = validateAnchor(reqBody.anchor);
      if (anchorError) {
        return reply.code(400).send({ error: "bad_request", message: anchorError });
      }

      const commentData: Omit<SessionComment, 'id' | 'createdAt' | 'replies'> = {
        sessionId,
        authorId: claims.sub,
        body: reqBody.body.trim(),
        anchor: reqBody.anchor,
        status: "open",
        resolvedBy: null,
        resolvedAt: null,
        updatedAt: new Date().toISOString(),
      };

      const comment = await fastify.storage.addComment(sessionId, commentData);

      // Fan-out to all WS clients in the session.
      // The REST response below is the ack for the originating client.
      broadcastCommentEvent("comment.add", sessionId, claims.sub, comment);

      return reply.code(201).send({ data: comment });
    }
  );

  /**
   * GET /api/v1/sessions/:sessionId/comments
   *
   * Return all comments for a session. No auth required.
   * Query: ?status=open|resolved|all (default: all)
   * Response 200: { data: SessionComment[] }
   */
  fastify.get(
    "/api/v1/sessions/:sessionId/comments",
    async (
      request: FastifyRequest<{ Params: SessionParams; Querystring: { status?: string } }>,
      reply: FastifyReply
    ) => {
      const { sessionId } = request.params;
      const statusFilter = (request.query as Record<string, string | undefined>)["status"] ?? "all";

      let comments = await fastify.storage.getComments(sessionId);

      if (statusFilter === "open") {
        comments = comments.filter((c) => c.status === "open");
      } else if (statusFilter === "resolved") {
        comments = comments.filter((c) => c.status === "resolved");
      }
      // "all" or unknown value → no filter

      return reply.code(200).send({ data: comments });
    }
  );

  /**
   * DELETE /api/v1/sessions/:sessionId/comments/:commentId
   *
   * Delete a comment. Requires:
   *   - owner role (can delete any comment), OR
   *   - collaborator role AND comment.authorId === token sub
   * Response 204 on success, 403 if unauthorized, 404 if not found.
   */
  fastify.delete(
    "/api/v1/sessions/:sessionId/comments/:commentId",
    async (
      request: FastifyRequest<{ Params: CommentParams }>,
      reply: FastifyReply
    ) => {
      const claims = await extractClaims(request);
      if (!claims) {
        return reply.code(401).send({ error: "unauthorized", message: "Missing or invalid Bearer token" });
      }
      if (claims.role === "viewer") {
        return reply.code(403).send({ error: "forbidden", message: "Viewers cannot delete comments" });
      }

      const { sessionId, commentId } = request.params;

      // Find comment first to check ownership before deleting.
      const allComments = await fastify.storage.getComments(sessionId);
      const target = allComments.find((c) => c.id === commentId);
      if (!target) {
        return reply.code(404).send({ error: "not_found", message: "Comment not found" });
      }

      // Only owner can delete any comment; collaborator can only delete their own.
      if (claims.role !== "owner" && target.authorId !== claims.sub) {
        return reply.code(403).send({ error: "forbidden", message: "You can only delete your own comments" });
      }

      await fastify.storage.deleteComment(sessionId, commentId);

      return reply.code(204).send();
    }
  );

  /**
   * PATCH /api/v1/sessions/:sessionId/comments/:commentId/resolve
   *
   * Mark a comment as resolved. Requires owner or collaborator role.
   * Response 200: { data: SessionComment }
   */
  fastify.patch(
    "/api/v1/sessions/:sessionId/comments/:commentId/resolve",
    async (
      request: FastifyRequest<{ Params: CommentParams }>,
      reply: FastifyReply
    ) => {
      const claims = await extractClaims(request);
      if (!claims) {
        return reply.code(401).send({ error: "unauthorized", message: "Missing or invalid Bearer token" });
      }
      if (claims.role === "viewer") {
        return reply.code(403).send({ error: "forbidden", message: "Viewers cannot resolve comments" });
      }

      const { sessionId, commentId } = request.params;
      const updated = await fastify.storage.resolveComment(sessionId, commentId, claims.sub);
      if (!updated) {
        return reply.code(404).send({ error: "not_found", message: "Comment not found" });
      }

      broadcastCommentEvent("comment.resolve", sessionId, claims.sub, {
        commentId,
        resolvedBy: updated.resolvedBy,
        resolvedAt: updated.resolvedAt,
      });

      return reply.code(200).send({ data: updated });
    }
  );

  /**
   * PATCH /api/v1/sessions/:sessionId/comments/:commentId/reopen
   *
   * Reopen a resolved comment. Requires owner or collaborator role.
   * Response 200: { data: SessionComment }
   */
  fastify.patch(
    "/api/v1/sessions/:sessionId/comments/:commentId/reopen",
    async (
      request: FastifyRequest<{ Params: CommentParams }>,
      reply: FastifyReply
    ) => {
      const claims = await extractClaims(request);
      if (!claims) {
        return reply.code(401).send({ error: "unauthorized", message: "Missing or invalid Bearer token" });
      }
      if (claims.role === "viewer") {
        return reply.code(403).send({ error: "forbidden", message: "Viewers cannot reopen comments" });
      }

      const { sessionId, commentId } = request.params;
      const updated = await fastify.storage.reopenComment(sessionId, commentId);
      if (!updated) {
        return reply.code(404).send({ error: "not_found", message: "Comment not found" });
      }

      broadcastCommentEvent("comment.reopen", sessionId, claims.sub, { commentId });

      return reply.code(200).send({ data: updated });
    }
  );

  /**
   * POST /api/v1/sessions/:sessionId/comments/:commentId/replies
   *
   * Add a reply to a comment thread. Requires owner or collaborator role.
   * Body: { body: string }
   * Response 201: { data: SessionComment } — the updated parent comment with replies[]
   */
  fastify.post(
    "/api/v1/sessions/:sessionId/comments/:commentId/replies",
    async (
      request: FastifyRequest<{ Params: CommentParams; Body: CreateReplyBody }>,
      reply: FastifyReply
    ) => {
      const claims = await extractClaims(request);
      if (!claims) {
        return reply.code(401).send({ error: "unauthorized", message: "Missing or invalid Bearer token" });
      }
      if (claims.role === "viewer") {
        return reply.code(403).send({ error: "forbidden", message: "Viewers cannot reply to comments" });
      }

      const { sessionId, commentId } = request.params;
      const reqBody = request.body;

      if (!reqBody || typeof reqBody.body !== "string" || !reqBody.body.trim()) {
        return reply.code(400).send({ error: "bad_request", message: "body is required" });
      }

      const result = await fastify.storage.addReply(sessionId, commentId, {
        authorId: claims.sub,
        body: reqBody.body.trim(),
      });
      if (!result) {
        return reply.code(404).send({ error: "not_found", message: "Comment not found" });
      }

      const { comment: updated, newReply } = result;

      broadcastCommentEvent("comment.reply", sessionId, claims.sub, {
        commentId,
        reply: newReply,
      });

      return reply.code(201).send({ data: updated });
    }
  );
}
