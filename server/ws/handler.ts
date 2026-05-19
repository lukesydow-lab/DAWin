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
import type { WebSocket } from "@fastify/websocket";

// @fastify/websocket v11 removed SocketStream. Provide a local shim that matches
// the shape used in this file: { socket: WebSocket } where socket is the raw WS.
interface SocketStream {
  socket: WebSocket;
}
import type {
  WsClientMessage,
  WsBroadcast,
  TransportState,
  Collaborator,
  ClientMeta,
  TrackArmPayload,
  TrackArmRejectedPayload,
  SessionId,
  UserId,
} from "../types.js";
import type { SessionRow, TrackRow, ClipRow } from "../storage/adapter.js";
import {
  getOrCreateSession,
  addClient,
  removeClient,
  updateTransport,
  getClients,
  acquireTrackLock,
  releaseTrackLock,
  releaseAllLocksForUser,
} from "../store.js";
import { verifyToken } from "../jwt.js";

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
  _clientId: string,
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
// Track locking
// ---------------------------------------------------------------------------

/**
 * track.arm — client requests to arm (record-enable) a track.
 *
 * Guards:
 *   1. Viewers cannot arm any track → track.arm_rejected { reason: 'forbidden' }
 *   2. Track already locked by a different user → track.arm_rejected { reason: 'locked' }
 *   3. Otherwise: acquire lock and broadcast track.locked to all clients.
 */
function handleTrackArm(
  socket: SocketStream,
  sessionId: string,
  userId: string,
  role: string,
  payload: unknown
): void {
  const p = isRecord(payload) ? payload : {};
  const trackId = typeof p["trackId"] === "string" ? p["trackId"] : null;
  if (!trackId) return;

  // Guard: viewers cannot record.
  if (role === "viewer") {
    const rejectedPayload: TrackArmRejectedPayload = {
      trackId,
      reason: "forbidden",
    };
    sendOne(socket.socket, broadcast<TrackArmRejectedPayload>(
      "track.arm_rejected",
      sessionId,
      "server",
      rejectedPayload
    ));
    return;
  }

  // Attempt to acquire the lock.
  const acquired = acquireTrackLock(sessionId, trackId, userId);
  if (!acquired) {
    const rejectedPayload: TrackArmRejectedPayload = {
      trackId,
      reason: "locked",
    };
    sendOne(socket.socket, broadcast<TrackArmRejectedPayload>(
      "track.arm_rejected",
      sessionId,
      "server",
      rejectedPayload
    ));
    return;
  }

  // Lock acquired — broadcast to all clients (including sender).
  const lockedFrame = broadcast<TrackArmPayload>(
    "track.locked",
    sessionId,
    userId,
    { trackId }
  );
  broadcastToSession(sessionId, lockedFrame);
}

/**
 * track.disarm — client releases the arm lock on a track.
 * Broadcasts track.unlocked to all clients if the lock was held by this user.
 */
function handleTrackDisarm(
  sessionId: string,
  userId: string,
  payload: unknown
): void {
  const p = isRecord(payload) ? payload : {};
  const trackId = typeof p["trackId"] === "string" ? p["trackId"] : null;
  if (!trackId) return;

  releaseTrackLock(sessionId, trackId, userId);

  // Broadcast unconditionally — idempotent for clients that missed the lock event.
  const unlockedFrame = broadcast<{ trackId: string }>(
    "track.unlocked",
    sessionId,
    userId,
    { trackId }
  );
  broadcastToSession(sessionId, unlockedFrame);
}

// ---------------------------------------------------------------------------
// Join / leave
// ---------------------------------------------------------------------------

async function handleJoin(
  socket: SocketStream,
  sessionId: string,
  clientId: string,
  meta: ClientMeta,
  fastify: FastifyInstance
): Promise<void> {
  // Hydrate persistent session data from the storage adapter (ADR-005).
  // If the session does not exist in the DB, refuse connection rather than
  // silently creating a blank in-memory session (ADR-005, Decision 5).
  const sessionData: SessionRow | null = await fastify.storage.getSession(sessionId);
  if (!sessionData) {
    socket.socket.close(4404, 'Session not found');
    fastify.log.warn({ sessionId }, 'ws: session not found in storage — closing');
    return;
  }

  const tracks: TrackRow[] = await fastify.storage.getTracks(sessionId);
  const clips: ClipRow[] = await fastify.storage.getClips(sessionId);

  const session = getOrCreateSession(sessionId);

  // Send current transport state immediately so the new client syncs on connect.
  const snapshotFrame = broadcast(
    "session.snapshot",
    sessionId,
    "server",
    {
      transport: session.transport,
      collaborators: buildCollaboratorList(sessionId),
      session: sessionData,
      tracks,
      clips,
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
// Comment broadcast helper (called by REST comment routes after mutations)
// ---------------------------------------------------------------------------

/**
 * Broadcast a comment lifecycle event to all WS clients in the session.
 *
 * The REST route is the source of truth for comment mutations. This function
 * is the fan-out only — it does NOT echo back to the originating HTTP client
 * (the REST response is the ack for the creator). All connected WS clients in
 * the session receive the frame regardless of which HTTP client triggered it.
 *
 * Event types: 'comment.add' | 'comment.reply' | 'comment.resolve' | 'comment.reopen'
 */
export function broadcastCommentEvent(
  type: string,
  sessionId: SessionId,
  fromUserId: UserId,
  payload: unknown
): void {
  const frame = broadcast<unknown>(type, sessionId, fromUserId, payload);
  broadcastToSession(sessionId, frame);
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
      const ticket = query["ticket"] as string | undefined;

      // Task 5-C: validate JWT ticket on connect. All identity is derived from
      // the JWT — no DB lookup on WS connect.
      if (!ticket) {
        socket.socket.close(4401, 'Missing ticket');
        return;
      }

      // Async validation — we kick off an async IIFE so the synchronous Fastify
      // WS callback can return while we await the token and storage hydration.
      void (async () => {
        let claims: Awaited<ReturnType<typeof verifyToken>>;
        try {
          claims = await verifyToken(ticket);
        } catch {
          socket.socket.close(4401, 'Invalid ticket');
          return;
        }

        const { sub: userId, role, color, isGuest } = claims;
        const displayName = claims.displayName ?? 'Unknown';

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

        // Immediately send session snapshot and announce join to peers (async — ADR-005).
        await handleJoin(socket, sessionId, clientId, meta, fastify);

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
              void handleJoin(socket, sessionId, clientId, meta, fastify);
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

            case "track.arm":
              handleTrackArm(socket, sessionId, userId, role, payload);
              break;

            case "track.disarm":
              handleTrackDisarm(sessionId, userId, payload);
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

          // Release all track locks held by this user before announcing departure,
          // so remaining clients receive track.unlocked before presence.left.
          const releasedTracks = releaseAllLocksForUser(sessionId, userId);
          for (const trackId of releasedTracks) {
            const unlockedFrame = broadcast<{ trackId: string }>(
              "track.unlocked",
              sessionId,
              userId,
              { trackId }
            );
            // broadcastToSession after handleLeave would exclude departed client,
            // but we call it here (before removeClient) — skip the disconnecting
            // client's socket which is already closed.
            broadcastToSession(sessionId, unlockedFrame, clientId);
            fastify.log.info(
              { sessionId, userId, trackId },
              "ws: track lock released on disconnect"
            );
          }

          // Remove client and broadcast departure to remaining peers.
          handleLeave(sessionId, clientId, userId, fastify);
        });

        socket.socket.on("error", (err: Error) => {
          fastify.log.error({ sessionId, userId, clientId, err }, "ws: socket error");
        });
      })();
    }
  );
}
