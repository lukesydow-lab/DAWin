/**
 * server/store.ts
 *
 * In-memory session store — prototype only.
 *
 * Trade-off: all state is lost on server restart. For the prototype this is
 * acceptable. When a database is introduced, replace `sessions` with a
 * `StorageAdapter` that wraps the same `SessionState` shape — consumers of
 * `getSession` / `getOrCreateSession` are unchanged.
 *
 * Not thread-safe. Node.js single-event-loop model makes this safe for a
 * single-process prototype; revisit if Worker threads are introduced for DSP.
 */

import { randomUUID } from "crypto";
import type {
  SessionId,
  ClientMeta,
  SessionState,
  TransportState,
} from "./types.js";

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

function defaultTransport(): TransportState {
  return {
    playing: false,
    recording: false,
    playheadBar: 0,
    bpm: 120,
    timeSignature: { numerator: 4, denominator: 4 },
    syncedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const sessions = new Map<SessionId, SessionState>();

/** Returns the existing session or creates a new one with default state. */
export function getOrCreateSession(sessionId: SessionId): SessionState {
  let state = sessions.get(sessionId);
  if (!state) {
    state = {
      sessionId,
      transport: defaultTransport(),
      clients: new Map<string, ClientMeta>(),
    };
    sessions.set(sessionId, state);
  }
  return state;
}

/** Returns the session or undefined if it does not exist. */
export function getSession(sessionId: SessionId): SessionState | undefined {
  return sessions.get(sessionId);
}

/** Adds a client connection to the session. Returns the generated clientId. */
export function addClient(sessionId: SessionId, meta: Omit<ClientMeta, never>): string {
  const session = getOrCreateSession(sessionId);
  const clientId = randomUUID();
  session.clients.set(clientId, meta);
  return clientId;
}

/** Removes a client from the session. Returns the removed ClientMeta or undefined. */
export function removeClient(
  sessionId: SessionId,
  clientId: string
): ClientMeta | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;
  const meta = session.clients.get(clientId);
  session.clients.delete(clientId);
  // Prune empty sessions to avoid leaking memory over long server runs.
  if (session.clients.size === 0) {
    sessions.delete(sessionId);
  }
  return meta;
}

/** Updates transport state in-place. Caller should set syncedAt = Date.now(). */
export function updateTransport(
  sessionId: SessionId,
  patch: Partial<TransportState>
): TransportState {
  const session = getOrCreateSession(sessionId);
  session.transport = { ...session.transport, ...patch };
  return session.transport;
}

/** Returns all ClientMeta values for a session (empty array if session unknown). */
export function getClients(sessionId: SessionId): ClientMeta[] {
  return Array.from(sessions.get(sessionId)?.clients.values() ?? []);
}
