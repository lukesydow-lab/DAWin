/**
 * server/types.ts
 *
 * Canonical server-side type definitions for the DAWin collaborative session backend.
 * These mirror the shared contracts defined in docs/specs/multitrack-backend-api.md.
 * The frontend source of truth is src/shared/types.ts — keep these in sync when
 * that file is created.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export type UserId = string;
export type SessionId = string;
export type TrackId = string;
export type ClipId = string;
export type PluginId = string;
export type AssetId = string;
export type UploadId = string;

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export type Role = "owner" | "collaborator" | "viewer";

/** JWT payload claims stored on every access token. */
export interface JwtClaims {
  sub: UserId;
  sessionId: SessionId;
  role: Role;
  color: string; // hex collaborator color assigned at join time
  isGuest: boolean;
  iat: number;
  exp: number;
}

/** Response from GET /api/v1/auth/me */
export interface MeResponse {
  userId: UserId;
  sessionId: SessionId;
  role: Role;
  color: string;
  displayName: string;
  email: string | null;
  isGuest: boolean;
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export interface Collaborator {
  userId: UserId;
  displayName: string;
  color: string; // assigned at session-join, stored per (userId, sessionId)
  role: Role;
  isGuest: boolean;
}

export interface Session {
  id: SessionId;
  name: string;
  bpm: number;
  timeSignature: { numerator: number; denominator: number };
  createdAt: string; // ISO 8601
  collaborators: Collaborator[];
}

// ---------------------------------------------------------------------------
// Track
// ---------------------------------------------------------------------------

export interface Track {
  id: TrackId;
  sessionId: SessionId;
  name: string;
  ownerId: UserId;
  color: string;
  volume: number; // 0–1 linear (fader curve applied in client)
  pan: number; // -1 to +1
  muted: boolean;
  soloed: boolean;
  armed: boolean;
  lockedBy: UserId | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Clip
// ---------------------------------------------------------------------------

export interface Clip {
  id: ClipId;
  trackId: TrackId;
  sessionId: SessionId;
  startBar: number;
  durationBars: number;
  assetId: AssetId | null;
  color: string; // inherited from track owner color
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Plugin chain
// ---------------------------------------------------------------------------

export type PluginType = "compressor" | "reverb" | "delay" | "maximizer" | "eq";

export interface Plugin {
  id: PluginId;
  type: PluginType;
  enabled: boolean;
  /** Opaque param blob — shape is plugin-type-specific */
  params: Record<string, number | string | boolean>;
}

export interface PluginChain {
  id: string;
  trackId: TrackId | null; // null = master bus
  sessionId: SessionId;
  plugins: Plugin[];
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

export interface TransportState {
  playing: boolean;
  recording: boolean;
  playheadBar: number;
  bpm: number;
  timeSignature: { numerator: number; denominator: number };
  syncedAt: number; // epoch ms — used for client drift correction
}

// ---------------------------------------------------------------------------
// Presence
// ---------------------------------------------------------------------------

export interface CollaboratorPresence {
  userId: UserId;
  playheadBar: number;
  cursorTrackId: TrackId | null;
  isRecording: boolean;
  updatedAt: number; // epoch ms
}

// ---------------------------------------------------------------------------
// Session store
// ---------------------------------------------------------------------------

/**
 * Per-connection metadata held in the server-side session store.
 * `ws` is the raw WebSocket socket from @fastify/websocket — typed as unknown
 * here to avoid a hard coupling to the ws module's internal types; cast at
 * the call site where `.send()` / `.readyState` are needed.
 */
export interface ClientMeta {
  userId: UserId;
  displayName: string;
  color: string;
  role: Role;
  isGuest: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ws: any; // raw WebSocket — intentionally opaque; cast to WebSocket at use site
}

/** Live in-memory state for one collaborative session. */
export interface SessionState {
  sessionId: SessionId;
  transport: TransportState;
  /** keyed by clientId (a uuid generated per WS connection) */
  clients: Map<string, ClientMeta>;
  /** Maps trackId → userId currently holding an exclusive arm/record lock. */
  trackLocks: Map<TrackId, UserId>;
  /**
   * In-memory comment list for this session.
   * TEMPORARY — lost on server restart. Replace with a storage adapter in Sprint 5+.
   * See ADR-003, Decision 2.
   */
  comments: SessionComment[];
}

// ---------------------------------------------------------------------------
// WebSocket messages
// ---------------------------------------------------------------------------

/**
 * Shape the client sends on the wire.
 *
 * RESOLUTION (Sprint 2): Clients send { type, sessionId, payload } only.
 * The server stamps `from: userId` (derived from the WS ticket) before
 * broadcasting. Any `from` field in an inbound client frame is discarded.
 */
export interface WsClientMessage {
  type: string;
  sessionId: SessionId;
  payload: unknown;
}

/** @deprecated — use WsClientMessage for inbound, WsBroadcast for outbound. */
export type WsMessageInbound<T = unknown> = {
  type: string;
  sessionId: SessionId;
  payload: T;
};

/** Outbound broadcast frame — server stamps `from` and `ts`. */
export interface WsBroadcast<T = unknown> {
  type: string;
  sessionId: SessionId;
  from: UserId; // stamped server-side; never trust client-supplied value
  payload: T;
  ts: number; // epoch ms — server-side timestamp
}

/** @deprecated — use WsBroadcast. Kept for backward compat with existing handler stub. */
export interface WsMessage<T = unknown> extends WsMessageInbound<T> {
  from: UserId;
}

// ---------------------------------------------------------------------------
// Track lock WS payloads
// ---------------------------------------------------------------------------

/** Client → Server: request to arm (record-enable) a track. */
export interface TrackArmPayload {
  trackId: TrackId;
}

/**
 * Server → Client: arm request rejected.
 *   locked    — another user already holds the lock
 *   forbidden — sender's role does not permit recording (viewer)
 */
export interface TrackArmRejectedPayload {
  trackId: TrackId;
  reason: "locked" | "forbidden";
}

// ---------------------------------------------------------------------------
// Comment anchor model (ADR-003)
// ---------------------------------------------------------------------------

export type CommentId = string;

export type CommentAnchorType =
  | "timeline"
  | "timeRange"
  | "track"
  | "clip"
  | "trackMoment";

/**
 * Canonical anchor for both inline comments and timeline deep links.
 *
 * Invariants (enforced server-side, not in the type system):
 *   - anchorType 'timeline' | 'trackMoment' | 'timeRange' → startBar required
 *   - anchorType 'timeRange' → endBar required, endBar > startBar
 *   - anchorType 'track' | 'trackMoment' → trackId required
 *   - anchorType 'clip' → trackId and clipId both required
 *
 * Bar-based only. startTimeSec/endTimeSec are intentionally omitted — derivable
 * from startBar + session BPM. See ADR-003 for rationale.
 */
export interface CommentAnchor {
  anchorType: CommentAnchorType;
  /** Bar position. Required for: timeline, timeRange, trackMoment. Optional seek hint for clip. */
  startBar?: number;
  /** End bar for ranges. Required for timeRange; must be > startBar. */
  endBar?: number;
  /** Required for: track, clip, trackMoment. */
  trackId?: TrackId;
  /** Required for: clip. Must be paired with trackId. */
  clipId?: ClipId;
  /**
   * Optional comment thread ID associated with this anchor.
   * Deep links use this to auto-open the thread popover on navigation.
   */
  threadId?: CommentId;
}

export interface CommentReply {
  id: CommentId;
  commentId: CommentId;
  authorId: UserId;
  body: string;
  createdAt: string; // ISO 8601
}

/**
 * A comment anchored to the session timeline, a track, or a clip.
 *
 * TEMPORARY: stored in SessionState.comments (in-memory, lost on restart).
 * Replace SessionState.comments with a storage adapter in Sprint 5+.
 * See ADR-003, Decision 2.
 */
export interface SessionComment {
  id: CommentId;
  sessionId: SessionId;
  authorId: UserId;
  body: string;
  anchor: CommentAnchor;
  replies: CommentReply[];
  status: "open" | "resolved";
  resolvedBy: UserId | null;
  resolvedAt: string | null; // ISO 8601 or null
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// Comment WS payloads (ADR-003, Decision 5)
// Used with WsBroadcast<T>. Server stamps `from` and `ts`.
// ---------------------------------------------------------------------------

/** Server → all clients (except originator): a new comment was created. */
// WsBroadcast<SessionComment> — no separate payload type needed; use SessionComment directly.

/** Server → all clients: a reply was added to an existing thread. */
export interface CommentReplyPayload {
  commentId: CommentId;
  reply: CommentReply;
}

/** Server → all clients: a comment was resolved. */
export interface CommentResolvePayload {
  commentId: CommentId;
  resolvedBy: UserId;
  resolvedAt: string; // ISO 8601
}

/** Server → all clients: a resolved comment was reopened. */
export interface CommentReopenPayload {
  commentId: CommentId;
}

// ---------------------------------------------------------------------------
// Audio file upload WS payload (ADR-006, Sprint 7)
// ---------------------------------------------------------------------------

/** Server → all session clients: a new audio file was successfully uploaded. */
export interface AudioUploadedPayload {
  audioFileId: string;
  sessionId: SessionId;
  filename: string;
  durationSec: number;
  /** 200-value RMS peaks array. Empty array = generation failed (render WaveformPlaceholder). */
  peaks: number[];
}

// ---------------------------------------------------------------------------
// API envelope
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
  code?: string;
  message?: string;
}
