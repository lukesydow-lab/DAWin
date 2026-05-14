/**
 * server/index.ts
 *
 * DAWin Fastify server — Sprint 2 scaffold.
 *
 * Starts on port 3001 (configurable via PORT env var).
 * Registers:
 *   - @fastify/websocket plugin → /ws
 *   - Auth routes         → /api/v1/auth/*
 *   - Session routes      → /api/v1/sessions/*
 *
 * Run: ts-node server/index.ts
 *
 * Health check: GET http://localhost:3001/health
 * Session stub: GET http://localhost:3001/api/v1/sessions/dev-session-001
 * Auth stub:    GET http://localhost:3001/api/v1/auth/me
 * WebSocket:    ws://localhost:3001/ws?sessionId=dev-session-001&ticket=dev
 */

import Fastify from "fastify";
import websocketPlugin from "@fastify/websocket";
import { authRoutes } from "./routes/auth.js";
import { sessionRoutes } from "./routes/sessions.js";
import { wsHandler } from "./ws/handler.js";

const PORT = parseInt(process.env["PORT"] ?? "3001", 10);
const HOST = process.env["HOST"] ?? "0.0.0.0";

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: "info",
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    },
    // 30-second request timeout enforces upload_timeout contract (Sprint 2 resolution #4)
    // This applies to all routes; the audio upload route relies on this limit.
    connectionTimeout: 30_000,
  });

  // ---------------------------------------------------------------------------
  // Plugins
  // ---------------------------------------------------------------------------

  await fastify.register(websocketPlugin);

  // ---------------------------------------------------------------------------
  // CORS — dev permissive; tighten for production
  // ---------------------------------------------------------------------------

  fastify.addHook("onRequest", async (request, reply) => {
    void request; // suppress unused var warning
    reply.header("Access-Control-Allow-Origin", process.env["CORS_ORIGIN"] ?? "*");
    reply.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  });

  fastify.options("/*", async (_request, reply) => {
    return reply.code(204).send();
  });

  // ---------------------------------------------------------------------------
  // Health check
  // ---------------------------------------------------------------------------

  fastify.get("/health", async (_request, reply) => {
    return reply.code(200).send({ status: "ok", ts: Date.now() });
  });

  // ---------------------------------------------------------------------------
  // Routes
  // ---------------------------------------------------------------------------

  await fastify.register(authRoutes);
  await fastify.register(sessionRoutes);
  await fastify.register(wsHandler);

  return fastify;
}

async function main(): Promise<void> {
  const server = await buildServer();

  try {
    await server.listen({ port: PORT, host: HOST });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
