/**
 * server/routes/sessions.ts
 *
 * Session routes — wired to fastify.storage in Sprint 5-B.
 *
 * Endpoints implemented:
 *   GET  /api/v1/sessions/:id   → SessionRow mapped to HTTP response shape
 *   POST /api/v1/sessions       → create a new session (owner role required)
 *
 * Stubbed (501):
 *   POST   /api/v1/sessions/:id/join
 *   DELETE /api/v1/sessions/:id
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { verifyToken } from "../jwt.js";
import type { Collaborator } from "../types.js";

interface SessionParams {
  id: string;
}

interface CreateSessionBody {
  name: unknown;
  bpm?: unknown;
  totalBars?: unknown;
}

export async function sessionRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/sessions/:id
   *
   * Calls fastify.storage.getSession(id). Returns 404 if not found.
   * Collaborators are not yet loaded from a SessionMember table — returns []
   * until Sprint 6 adds that join.
   */
  fastify.get(
    "/api/v1/sessions/:id",
    async (
      request: FastifyRequest<{ Params: SessionParams }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;

      const session = await fastify.storage.getSession(id);

      if (session === null) {
        return reply.code(404).send({ error: "Session not found" });
      }

      // TODO: load from SessionMember table in Sprint 6
      const collaborators: Collaborator[] = [];

      return reply.code(200).send({
        data: {
          id: session.id,
          name: session.name,
          bpm: session.bpm,
          timeSignature: session.timeSignature,
          totalBars: session.totalBars,
          collaborators,
        },
      });
    }
  );

  /**
   * POST /api/v1/sessions
   *
   * Requires a valid Bearer JWT with role === 'owner'.
   * Body: { name: string, bpm?: number, totalBars?: number }
   * Returns 201 with the created SessionRow.
   */
  fastify.post(
    "/api/v1/sessions",
    async (request: FastifyRequest, reply: FastifyReply) => {
      // --- Auth: require Bearer token with owner role ---
      const authHeader = request.headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return reply
          .code(401)
          .send({ error: "unauthorized", message: "Missing Bearer token" });
      }

      const token = authHeader.slice("Bearer ".length).trim();
      let claims;
      try {
        claims = await verifyToken(token);
      } catch {
        return reply
          .code(401)
          .send({ error: "unauthorized", message: "Invalid or expired token" });
      }

      if (claims.role !== "owner") {
        return reply
          .code(403)
          .send({ error: "forbidden", message: "Owner role required to create a session" });
      }

      // --- Body validation ---
      const body = request.body as CreateSessionBody | null;

      if (
        !body ||
        typeof body.name !== "string" ||
        body.name.trim().length === 0
      ) {
        return reply
          .code(400)
          .send({ error: "bad_request", message: "name must be a non-empty string" });
      }

      const bpm =
        typeof body.bpm === "number" && isFinite(body.bpm) ? body.bpm : 120;
      const totalBars =
        typeof body.totalBars === "number" && isFinite(body.totalBars)
          ? body.totalBars
          : 128;

      // --- Persist ---
      const created = await fastify.storage.createSession({
        name: body.name.trim(),
        bpm,
        timeSignature: { numerator: 4, denominator: 4 },
        totalBars,
      });

      return reply.code(201).send({ data: created });
    }
  );

  /** POST /api/v1/sessions/:id/join — stub */
  fastify.post(
    "/api/v1/sessions/:id/join",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.code(501).send({ error: "not_implemented" });
    }
  );

  /** DELETE /api/v1/sessions/:id — stub */
  fastify.delete(
    "/api/v1/sessions/:id",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.code(501).send({ error: "not_implemented" });
    }
  );
}
