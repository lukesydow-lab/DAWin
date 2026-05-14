/**
 * server/routes/auth.ts
 *
 * Auth routes — Sprint 2 scaffold stubs.
 * Production: validate JWT via `jose`, query user store.
 * Stub: returns a hardcoded dev user for local frontend integration.
 *
 * Endpoints implemented:
 *   GET  /api/v1/auth/me   → MeResponse
 *
 * Stubbed (schema only, 501 response):
 *   POST /api/v1/auth/register
 *   POST /api/v1/auth/login
 *   POST /api/v1/auth/guest
 *   POST /api/v1/auth/refresh
 *   POST /api/v1/auth/logout
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { MeResponse } from "../types.js";

/** Hardcoded dev identity — replace with JWT decode + user lookup in production. */
const DEV_USER: MeResponse = {
  userId: "dev-user-001",
  sessionId: "dev-session-001",
  role: "owner",
  color: "#7C3AED", // violet — matches seed collaborator color in App.tsx
  displayName: "Dev User",
  email: "dev@dawin.local",
  isGuest: false,
};

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/auth/me
   *
   * Returns the session identity decoded from the bearer JWT.
   * Stub returns DEV_USER unconditionally — no token validation yet.
   *
   * Production behavior:
   *   1. Extract `Authorization: Bearer <token>` header
   *   2. Verify + decode with `jose` using the server's JWT secret
   *   3. Return { userId, sessionId, role, color, displayName, email, isGuest }
   *   4. Return 401 if token is missing, expired, or malformed
   */
  fastify.get(
    "/api/v1/auth/me",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      // TODO(production): extract + verify Bearer token, return real user
      return reply.code(200).send({ data: DEV_USER });
    }
  );

  /** POST /api/v1/auth/register — stub */
  fastify.post(
    "/api/v1/auth/register",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.code(501).send({ error: "not_implemented" });
    }
  );

  /** POST /api/v1/auth/login — stub */
  fastify.post(
    "/api/v1/auth/login",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.code(501).send({ error: "not_implemented" });
    }
  );

  /** POST /api/v1/auth/guest — stub */
  fastify.post(
    "/api/v1/auth/guest",
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
