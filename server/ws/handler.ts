/**
 * server/ws/handler.ts
 *
 * WebSocket upgrade handler — Sprint 2: real message routing.
 *
 * Routing table:
 *   session.join        → add client to store, send session.snapshot to joiner,
 *                         broadcast presence.joined to all others
 *   session.leave       → remove client, broadcast presence.left
 *   transport.play      → set isPlaying:true, stamp syncedAt, broadcast transport.state_sync
 *   transport.pause     → set isPlaying:false, broadcast transport.state_sync
 *   transport.stop      → alias for pause (preserves playhead per DAW convention)
 *   transport.seek      → update playheadBar, broadcast transport.state_sync
 *   transport.bpm_change→ update bpm, broadcast transport.state_sync
 *   presence.update     → fan-out to all other clients in the session (ephemeral)
 *
 * Security: server stamps `from: userId` on all outbound frames; any `from`
 * supplied by the client is silently discarded.
 *
 * Binary audio frames (prefixed "DAW1") are acknowledged and dropped until
 * the audio pipeline sprint.
 */

import type { FastifyInstance, FastifyRequest } from "fastify";
import type { SocketStream } from "@fastify/websocket";
import type {
  WsClientMessage,
  WsBroadcast,
  TransportState,
  CollaboratorPresence,
  Collaborator,
  ClientMeta,
} from "../types.js";
import {
  getOrCreateSession,
  addClient,
  removeClient,
  updateTransport,
  getClients,
} from "../store.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Magic bytes identifying a binary audio chunk frame: "DAW1" */
const AUDIO_FRAME_MAGIC = Buffer.from([0x44, 0x41, 0x57, 0x31]);

function isAudioFrame(data: Buffer): boolean {
  return data.length >= 4 && data.subarray(0, 4).equals(AUDIO_FRAME_MAGIC);
}

/** Build a server-stamped outbound broadcast frame. */
function broadcast<T>(
  type: string,
  sessionId: string,
  from: string,
  payload: T
): WsBroadcast<T> {
  return { type, sessionId, from, payload, ts: Date.now() };
}

/** Send a JSON frame to a single raw WebSocket, swallowing closed-socket errors. */
function sendOne(ws: unknown, frame: WsBroadcast<unknown>): void {
  // ws is typed as unknown in ClientMeta to avoid coupling to the ws package
  // internals. We cast here — the only call site where we need .send().
  const socket = ws as { readyState: number; send(data: string): void };
  if (socket.readyState === 1 /* OPEN */) {
    socket.send(JSON.stringify(frame));
  }
}

/** Broadcast a frame to every open client in a session, optionally skipping one. */
function broadcastToSession(
  sessionId: string,
  frame: WsBroadcast<unknown>,
  skipClientId?: string
): void {
  const session = getOrCreateSession(sessionId);
  for (const [clientId, meta] of session.clients) {
    if (skipClientId !== undefined && clientId === skipClientId) continue;
    sendOne(meta.ws, frame);
  }
}

/** Build a Collaborator summary list from current session clients. */
function buildCollaboratorList(sessionId: string): Collaborator[] {
  return getClients(sessionId).map((c) => ({
    userId: c.userId,
    displayName: c.displayName,
    color: c.color,
    role: c.role,
    isGuest: c.isGuest,
  }));
}

// ---------------------------------------------------------------------------
// Payload type guards (minimal — prototype-sufficient)
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asNumber(v: unknown, fallback: number): number {
  return typeof v === "number" && isFinite(v) ? v : fallback;
}

// ---------------------------------------------------------------------------
// Message handlers
// ---------------------------------------------------------------------------

function handleTransportPlay(
  sessionId: string,
  clientId: string,
  userId: string,
  payload: unknown
): void {
  const p = isRecord(payload) ? payload : {};
  const session = getOrCreateSession(sessionId);
  const transport = updateTransport(sessionId, {
    playing: true,
    playheadBar: asNumber(p["playheadBar"], session.transport.playheadBar),
    bpm: asNumber(p["bpm"], session.transport.bpm),
    syncedAt: Date.now(),
  });
  const frame = broadcast<TransportState>("transport.state_sync", sessionId, userId, transport);
  broadcastToSession(sessionId, frame);
}

function handleTransportPause(
  sessionId: string,
  userId: string
): void {
  const transport = updateTransport(sessionId, {
    playing: false,
    syncedAt: Date.now(),
  });
  const frame = broadcast<TransportState>("transport.state_sync", sessionId, userId, transport);
  broadcastToSession(sessionId, frame);
}

function handleTransportSeek(
  sessionId: string,
  userId: string,
  payload: unknown
): void {
  const p = isRecord(payload) ? payload : {};
  const session = getOrCreateSession(sessionId);
  const transport = updateTransport(sessionId, {
    playheadBar: asNumber(p["playheadBar"], session.transport.playheadBar),
    syncedAt: Date.now(),
  });
  const frame = broadcast<TransportState>("transport.state_sync", sessionId, userId, transport);
  broadcastToSession(sessionId, frame);
}

function handleTransportBpmChange(
  sessionId: string,
  userId: string,
  payload: unknown
): void {
  const p = isRecord(payload) ? payload : {};
  const session = getOrCreateSession(sessionId);
  const transport = updateTransport(sessionId, {
    bpm: asNumber(p["bpm"], session.transport.bpm),
    syncedAt: Date.now(),
  });
  const frame = broadcast<TransportState>("transport.state_sync", sessionId, userId, transport);
  broadcastToSession(sessionId, frame);
}

function handlePresenceUpdate(
  sessionId: string,
  clientId: string,
  userId: string,
  payload: unknown
): void {
  // Fan-out to all *other* clients — presence is ephemeral, not stored.
  const frame = broadcast<unknown>("presence.update", sessionId, userId, payload);
  broadcastToSession(sessionId, frame, clientId);
}

// ---------------------------------------------------------------------------
// Join / leave
// ---------------------------------------------------------------------------

function handleJoin(
  socket: SocketStream,
  sessionId: string,
  clientId: string,
  meta: ClientMeta,
  fastify: FastifyInstance
): void {
  const session = getOrCreateSession(sessionId);

  // Send current transport state immediately so the new client syncs on connect.
  const snapshotFrame = broadcast(
    "session.snapshot",
    sessionId,
    "server",
    {
      transport: session.transport,
      collaborators: buildCollaboratorList(sessionId),
    }
  );
  sendOne(socket.socket, snapshotFrame);

  // Broadcast presence.joined to all *other* clients.
  const collaborator: Collaborator = {
    userId: meta.userId,
    displayName: meta.displayName,
    color: meta.color,
    role: meta.role,
    isGuest: meta.isGuest,
  };
  const joinedFrame = broadcast(
    "presence.joined",
    sessionId,
    meta.userId,
    { collaborator }
  );
  broadcastToSession(sessionId, joinedFrame, clientId);

  fastify.log.info(
    { sessionId, userId: meta.userId, clientId },
    "ws: client joined session"
  );
}

function handleLeave(
  sessionId: string,
  clientId: string,
  userId: string,
  fastify: FastifyInstance
): void {
  removeClient(sessionId, clientId);

  const leftFrame = broadcast(
    "presence.left",
    sessionId,
    userId,
    { userId }
  );
  broadcastToSession(sessionId, leftFrame);

  fastify.log.info({ sessionId, userId, clientId }, "ws: client left session");
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function wsHandler(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    "/ws",
    { websocket: true },
    (socket: SocketStream, request: FastifyRequest) => {
      const query = request.query as Record<string, string | undefined>;
      const sessionId = query["sessionId"] ?? "unknown";
      const ticket = query["ticket"] ?? null;

      // TODO(production): validate ticket against one-time ticket store; reject
      // with WS close code 4401 if invalid or expired.
      // For stub/dev: accept all connections and derive a hardcoded dev user.
      const userId = "dev-user-001";
      const displayName = "Dev User";
      const color = "#7C3AED";
      const role = "owner" as const;
      const isGuest = false;

      void ticket; // suppress unused-var warning until ticket validation lands

      // Register client in the session store.
      const meta: ClientMeta = {
        userId,
        displayName,
        color,
        role,
        isGuest,
        ws: socket.socket,
      };
      const clientId = addClient(sessionId, meta);

      // Immediately send session snapshot and announce join to peers.
      handleJoin(socket, sessionId, clientId, meta, fastify);

      // -----------------------------------------------------------------------
      // Message routing
      // -----------------------------------------------------------------------

      socket.socket.on("message", (rawData: Buffer | string) => {
        const data = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData);

        // Binary audio frame — acknowledge receipt, drop chunk until audio sprint.
        if (isAudioFrame(data)) {
          fastify.log.info(
            { sessionId, userId, bytes: data.length },
            "ws: audio chunk received (stub: dropped)"
          );
          return;
        }

        // JSON control frame
        let inbound: WsClientMessage;
        try {
          inbound = JSON.parse(data.toString("utf8")) as WsClientMessage;
        } catch {
          fastify.log.warn({ userId, sessionId }, "ws: invalid JSON frame — discarding");
          return;
        }

        const { type, payload } = inbound;

        fastify.log.info({ type, sessionId, userId }, "ws: received message");

        switch (type) {
          case "session.join":
            // Re-join is a no-op — the client was already added at connect time.
            // This event exists so the frontend can explicitly re-announce after a
            // reconnect without tearing down the WS connection.
            handleJoin(socket, sessionId, clientId, meta, fastify);
            break;

          case "session.leave":
            handleLeave(sessionId, clientId, userId, fastify);
            break;

          case "transport.play":
            handleTransportPlay(sessionId, clientId, userId, payload);
            break;

          case "transport.pause":
          case "transport.stop":
            // stop = pause-in-place per DAW convention (preserves playhead)
            handleTransportPause(sessionId, userId);
            break;

          case "transport.seek":
            handleTransportSeek(sessionId, userId, payload);
            break;

          case "transport.bpm_change":
            handleTransportBpmChange(sessionId, userId, payload);
            break;

          case "presence.update":
            handlePresenceUpdate(sessionId, clientId, userId, payload);
            break;

          default:
            fastify.log.warn({ type, sessionId, userId }, "ws: unknown message type — ignoring");
        }
      });

      // -----------------------------------------------------------------------
      // Disconnect
      // -----------------------------------------------------------------------

      socket.socket.on("close", (code: number, reason: Buffer) => {
        fastify.log.info(
          { sessionId, userId, clientId, code, reason: reason.toString() },
          "ws: client disconnected"
        );

        // Remove client and broadcast departure to remaining peers.
        // This also releases any track locks held by userId (TODO: implement
        // lock release here when track locking lands in the next sprint).
        handleLeave(sessionId, clientId, userId, fastify);
      });

      socket.socket.on("error", (err: Error) => {
        fastify.log.error({ sessionId, userId, clientId, err }, "ws: socket error");
      });
    }
  );
}
