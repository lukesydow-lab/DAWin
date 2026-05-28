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
  TrackId,
  UserId,
  ClientMeta,
  SessionState,
  TransportState,
  SessionComment,
  CommentReply,
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
      trackLocks: new Map<TrackId, UserId>(),
      comments: [],
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

// ---------------------------------------------------------------------------
// Track lock helpers
// ---------------------------------------------------------------------------

/**
 * Attempt to acquire an exclusive arm/record lock on a track for userId.
 * Returns true if the lock was acquired (either fresh or already held by the
 * same user). Returns false if a *different* user currently holds the lock.
 */
export function acquireTrackLock(
  sessionId: SessionId,
  trackId: TrackId,
  userId: UserId
): boolean {
  const session = getOrCreateSession(sessionId);
  const current = session.trackLocks.get(trackId);
  if (current !== undefined && current !== userId) {
    return false; // locked by someone else
  }
  session.trackLocks.set(trackId, userId);
  return true;
}

/**
 * Release the lock on a track if it is held by userId.
 * Returns true if the lock was released, false if the track was not locked by
 * this user (or not locked at all — idempotent).
 */
export function releaseTrackLock(
  sessionId: SessionId,
  trackId: TrackId,
  userId: UserId
): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  if (session.trackLocks.get(trackId) !== userId) return false;
  session.trackLocks.delete(trackId);
  return true;
}

/**
 * Release every lock held by userId in the session.
 * Returns the list of trackIds that were unlocked (may be empty).
 * Called on WS disconnect to clean up dangling locks.
 */
export function releaseAllLocksForUser(
  sessionId: SessionId,
  userId: UserId
): TrackId[] {
  const session = sessions.get(sessionId);
  if (!session) return [];
  const released: TrackId[] = [];
  for (const [trackId, lockOwner] of session.trackLocks) {
    if (lockOwner === userId) {
      session.trackLocks.delete(trackId);
      released.push(trackId);
    }
  }
  return released;
}

// ---------------------------------------------------------------------------
// Comment helpers
// ---------------------------------------------------------------------------

/** Append a new comment to the session comment list. */
export function addComment(sessionId: SessionId, comment: SessionComment): void {
  const session = getOrCreateSession(sessionId);
  session.comments.push(comment);
}

/** Return all comments for a session (empty array if session unknown). */
export function getComments(sessionId: SessionId): SessionComment[] {
  return sessions.get(sessionId)?.comments ?? [];
}

/**
 * Mark a comment as resolved by userId.
 * Returns the updated comment, or undefined if commentId is not found.
 */
export function resolveComment(
  sessionId: SessionId,
  commentId: string,
  resolvedBy: UserId
): SessionComment | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;
  const comment = session.comments.find((c) => c.id === commentId);
  if (!comment) return undefined;
  const now = new Date().toISOString();
  comment.status = "resolved";
  comment.resolvedBy = resolvedBy;
  comment.resolvedAt = now;
  comment.updatedAt = now;
  return comment;
}

/**
 * Reopen a resolved comment (clear resolvedBy/resolvedAt).
 * Returns the updated comment, or undefined if commentId is not found.
 */
export function reopenComment(
  sessionId: SessionId,
  commentId: string
): SessionComment | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;
  const comment = session.comments.find((c) => c.id === commentId);
  if (!comment) return undefined;
  const now = new Date().toISOString();
  comment.status = "open";
  comment.resolvedBy = null;
  comment.resolvedAt = null;
  comment.updatedAt = now;
  return comment;
}

/**
 * Append a reply to a comment's replies array.
 * Returns the updated parent comment, or undefined if commentId is not found.
 */
export function addReply(
  sessionId: SessionId,
  commentId: string,
  reply: CommentReply
): SessionComment | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;
  const comment = session.comments.find((c) => c.id === commentId);
  if (!comment) return undefined;
  comment.replies.push(reply);
  comment.updatedAt = new Date().toISOString();
  return comment;
}

/**
 * Delete a comment by ID.
 * Returns true if found and removed, false otherwise.
 */
export function deleteComment(
  sessionId: SessionId,
  commentId: string
): SessionComment | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;
  const idx = session.comments.findIndex((c) => c.id === commentId);
  if (idx === -1) return undefined;
  const [removed] = session.comments.splice(idx, 1);
  return removed;
}
