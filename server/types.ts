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
