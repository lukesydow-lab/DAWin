/**
 * server/routes/sessions.ts
 *
 * Session routes — Sprint 2 scaffold stubs.
 * Returns seed session data for frontend integration testing.
 *
 * Endpoints implemented:
 *   GET  /api/v1/sessions/:id   → Session (with collaborators[])
 *
 * Stubbed (501):
 *   POST   /api/v1/sessions
 *   POST   /api/v1/sessions/:id/join
 *   DELETE /api/v1/sessions/:id
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { Session } from "../types.js";

/** Seed session — mirrors the shape of session state in src/App.tsx. */
const SEED_SESSION: Session = {
  id: "dev-session-001",
  name: "Untitled Session",
  bpm: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  createdAt: new Date().toISOString(),
  collaborators: [
    {
      userId: "dev-user-001",
      displayName: "Dev User",
      color: "#7C3AED",
      role: "owner",
      isGuest: false,
    },
    {
      userId: "dev-user-002",
      displayName: "Collaborator A",
      color: "#2563EB",
      role: "collaborator",
      isGuest: false,
    },
  ],
};

interface SessionParams {
  id: string;
}

export async function sessionRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/sessions/:id
   *
   * Returns the session record including current collaborators list.
   * Stub: matches on the dev seed session ID, returns 404 otherwise.
   *
   * Production: query session store, verify caller is a session member.
   */
  fastify.get(
    "/api/v1/sessions/:id",
    async (
      request: FastifyRequest<{ Params: SessionParams }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;

      if (id !== SEED_SESSION.id) {
        return reply
          .code(404)
          .send({ error: "session_not_found", code: "SESSION_NOT_FOUND" });
      }

      return reply.code(200).send({ data: SEED_SESSION });
    }
  );

  /** POST /api/v1/sessions — stub */
  fastify.post(
    "/api/v1/sessions",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.code(501).send({ error: "not_implemented" });
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
