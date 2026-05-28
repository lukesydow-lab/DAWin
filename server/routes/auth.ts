/**
 * server/routes/auth.ts
 *
 * Auth routes — Sprint 2: JWT-backed login, guest join, and token verification.
 *
 * Endpoints implemented:
 *   GET  /api/v1/auth/me     → verifies Bearer token, returns MeResponse
 *   POST /api/v1/auth/login  → accepts any non-empty credentials, returns JWT
 *   POST /api/v1/auth/guest  → issues anonymous guest JWT
 *
 * Stubbed (501):
 *   POST /api/v1/auth/register
 *   POST /api/v1/auth/refresh
 *   POST /api/v1/auth/logout
 *
 * Role map (hardcoded for prototype — replace with a user store in production):
 *   dev@dawin.local   → owner
 *   collab@dawin.local → collaborator
 *   <anything else>   → viewer
 */

import { randomUUID } from "crypto";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { MeResponse } from "../types.js";
import { signToken, verifyToken } from "../jwt.js";

// ---------------------------------------------------------------------------
// Hardcoded role + display-name map (prototype only)
// ---------------------------------------------------------------------------

interface KnownUser {
  role: "owner" | "collaborator" | "viewer";
  displayName: string;
  color: string;
}

const KNOWN_USERS: Record<string, KnownUser> = {
  "dev@dawin.local": {
    role: "owner",
    displayName: "Dev User",
    color: "#7C3AED",
  },
  "collab@dawin.local": {
    role: "collaborator",
    displayName: "Collab User",
    color: "#0EA5E9",
  },
};

const DEFAULT_VIEWER: KnownUser = {
  role: "viewer",
  displayName: "Viewer",
  color: "#64748B",
};

// ---------------------------------------------------------------------------
// Request body types
// ---------------------------------------------------------------------------

interface LoginBody {
  email: string;
  password: string;
}

// ---------------------------------------------------------------------------
// Route plugin
// ---------------------------------------------------------------------------

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/auth/me
   *
   * Extracts the Bearer token from the Authorization header, verifies it, and
   * returns the decoded claims as MeResponse.
   * Returns 401 if the header is missing or the token is invalid/expired.
   */
  fastify.get(
    "/api/v1/auth/me",
    async (request: FastifyRequest, reply: FastifyReply) => {
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

      // Resolve display metadata from the known-users map (best-effort).
      const known = KNOWN_USERS[claims.sub] ?? null;
      const me: MeResponse = {
        userId: claims.sub,
        sessionId: claims.sessionId,
        role: claims.role,
        color: claims.color,
        displayName: known?.displayName ?? (claims.isGuest ? "Guest" : "User"),
        email: claims.isGuest ? null : claims.sub,
        isGuest: claims.isGuest,
      };

      return reply.code(200).send({ data: me });
    }
  );

  /**
   * POST /api/v1/auth/login
   *
   * Body: { email: string, password: string }
   * Prototype: accepts any non-empty credentials — no real password check.
   * Returns a signed JWT.
   */
  fastify.post(
    "/api/v1/auth/login",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as LoginBody;

      if (!body || !body.email || !body.password) {
        return reply
          .code(400)
          .send({ error: "bad_request", message: "email and password required" });
      }

      const known = KNOWN_USERS[body.email] ?? DEFAULT_VIEWER;

      // For prototype: accept any non-empty password. In production, verify
      // against a hashed credential store before calling signToken.
      const token = await signToken({
        sub: body.email,
        sessionId: "dev-session-001", // TODO(production): derive from session lookup
        role: known.role,
        color: known.color,
        isGuest: false,
        displayName: known.displayName,
      });

      return reply.code(200).send({
        data: {
          token,
          userId: body.email,
          role: known.role,
          color: known.color,
          displayName: known.displayName,
          isGuest: false,
        },
      });
    }
  );

  /**
   * POST /api/v1/auth/guest
   *
   * Issues an anonymous guest JWT with role: viewer, isGuest: true.
   * The userId is a generated UUID — guests cannot reclaim their identity after
   * the token expires.
   */
  fastify.post(
    "/api/v1/auth/guest",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const guestId = `guest-${randomUUID()}`;
      // Assign a muted teal color for guests — avoids colliding with named
      // collaborator colors in the seed palette.
      const guestColor = "#14B8A6";

      // Use the UUID portion after "guest-" as a short display name for guests.
      // In production, accept an optional displayName from the request body.
      const guestDisplayName = `Guest ${guestId.slice(-8)}`;
      const token = await signToken({
        sub: guestId,
        sessionId: "dev-session-001", // TODO(production): require sessionId in body
        role: "viewer",
        color: guestColor,
        isGuest: true,
        displayName: guestDisplayName,
      });

      return reply.code(200).send({
        data: {
          token,
          userId: guestId,
          role: "viewer",
          color: guestColor,
          displayName: guestDisplayName,
          isGuest: true,
        },
      });
    }
  );

  /** POST /api/v1/auth/register — stub */
  fastify.post(
    "/api/v1/auth/register",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.code(501).send({ error: "not_implemented" });
    }
  );

  /** POST /api/v1/auth/refresh — stub */
  fastify.post(
    "/api/v1/auth/refresh",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.code(501).send({ error: "not_implemented" });
    }
  );

  /** POST /api/v1/auth/logout — stub */
  fastify.post(
    "/api/v1/auth/logout",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.code(501).send({ error: "not_implemented" });
    }
  );
}
