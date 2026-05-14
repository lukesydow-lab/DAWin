/**
 * server/ws/handler.ts
 *
 * WebSocket upgrade handler — Sprint 2 scaffold stub.
 *
 * Current behavior: echo all JSON frames back to the sender.
 * The server stamps `from: "dev-user-001"` on every echoed message,
 * demonstrating the server-side `from` stamping contract (Sprint 2 resolution #1).
 *
 * Binary frames (prefixed with magic bytes 0x44 0x41 0x57 0x31 = "DAW1") are
 * acknowledged with a log line and dropped — audio chunk handling is next sprint.
 *
 * Production behavior:
 *   1. Validate `?ticket=` query param (one-time WS ticket, 30 s TTL)
 *   2. Derive userId from ticket → stamp `from` on all outbound frames
 *   3. Add connection to session fan-out map (Map<sessionId, Set<WebSocket>>)
 *   4. Handle each event type (transport, track, clip, presence, plugin)
 *   5. Release all track locks held by userId on disconnect
 */

import type { FastifyInstance, FastifyRequest } from "fastify";
import type { SocketStream } from "@fastify/websocket";
import type { WsMessage, WsMessageInbound } from "../types.js";

/** Magic bytes identifying a binary audio chunk frame: "DAW1" */
const AUDIO_FRAME_MAGIC = Buffer.from([0x44, 0x41, 0x57, 0x31]);

function isAudioFrame(data: Buffer): boolean {
  if (data.length < 4) return false;
  return data.slice(0, 4).equals(AUDIO_FRAME_MAGIC);
}

/**
 * Stamps `from: userId` onto an inbound client message before echo/broadcast.
 * In production, `userId` comes from the authenticated WS ticket.
 * Any `from` field the client sent is overwritten unconditionally.
 */
function stampFrom(
  inbound: WsMessageInbound,
  userId: string
): WsMessage {
  return {
    type: inbound.type,
    sessionId: inbound.sessionId,
    payload: inbound.payload,
    from: userId, // server-side stamp — client-supplied `from` discarded
  };
}

export async function wsHandler(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    "/ws",
    { websocket: true },
    (socket: SocketStream, request: FastifyRequest) => {
      const query = request.query as Record<string, string | undefined>;
      const sessionId = query["sessionId"] ?? "unknown";
      const ticket = query["ticket"] ?? null;

      // TODO(production): validate ticket → reject with 4401 close code if invalid
      // For stub: accept all connections, derive a hardcoded dev userId
      const userId = "dev-user-001";

      fastify.log.info(
        { sessionId, userId, ticket: ticket ? "[present]" : "[missing]" },
        "ws: client connected"
      );

      socket.socket.on("message", (rawData: Buffer | string) => {
        const data = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData);

        // Binary audio frame — acknowledge receipt, drop chunk (stub)
        if (isAudioFrame(data)) {
          fastify.log.info(
            { sessionId, userId, bytes: data.length },
            "ws: audio chunk received (stub: dropped)"
          );
          // TODO(production): route to in-flight buffer accumulator
          return;
        }

        // JSON control frame
        let inbound: WsMessageInbound;
        try {
          inbound = JSON.parse(data.toString("utf8")) as WsMessageInbound;
        } catch {
          fastify.log.warn({ userId, sessionId }, "ws: invalid JSON frame — discarding");
          return;
        }

        fastify.log.info(
          { type: inbound.type, sessionId, userId },
          "ws: received message"
        );

        // Stamp server-side `from` and echo back (stub: no fan-out yet)
        const outbound: WsMessage = stampFrom(inbound, userId);

        if (socket.socket.readyState === socket.socket.OPEN) {
          socket.socket.send(JSON.stringify(outbound));
        }
      });

      socket.socket.on("close", (code: number, reason: Buffer) => {
        fastify.log.info(
          { sessionId, userId, code, reason: reason.toString() },
          "ws: client disconnected"
        );
        // TODO(production): release all track locks held by userId in this session
      });

      socket.socket.on("error", (err: Error) => {
        fastify.log.error({ sessionId, userId, err }, "ws: socket error");
      });
    }
  );
}
