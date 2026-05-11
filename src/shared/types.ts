// ─── Shared API Types — source of truth for frontend stubs and backend implementation
// All REST responses wrap in ApiResponse<T>; all WebSocket messages conform to WsMessage<T>.
// Version: v1

// ─── Primitives ───────────────────────────────────────────────────────────────

export type UserId      = string   // UUID v4
export type SessionId   = string   // UUID v4
export type TrackId     = string   // UUID v4
export type ClipId      = string   // UUID v4
export type AssetId     = string   // UUID v4 — references blob storage object
export type PluginId    = string   // UUID v4
export type PluginChainId = string // UUID v4

export type TrackType   = 'Audio' | 'MIDI' | 'Bus'
export type Role        = 'Owner' | 'Editor' | 'Viewer'
export type FadeCurve   = 'linear' | 'ease' | 'sharp'

// Playhead position: bars are zero-indexed floats (0.5 = halfway through bar 1)
export type BarPosition = number

// ─── REST envelope ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data:    T
  error:   null
}

export interface ApiError {
  data:    null
  error: {
    code:    string   // e.g. "TRACK_LOCKED", "UNAUTHORIZED"
    message: string
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

// JWT payload shape — decoded on client, verified server-side
export interface JwtPayload {
  sub:       UserId     // user id
  sessionId: SessionId  // active session
  role:      Role
  iat:       number
  exp:       number
  // guest accounts have isGuest: true; sub is still a stable anonymous UUID
  isGuest?:  boolean
}

export interface AuthTokenResponse {
  accessToken:  string  // JWT, short-lived (15 min)
  refreshToken: string  // opaque, long-lived (7 days), HTTP-only cookie preferred
  user:         User
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id:        UserId
  name:      string
  email:     string | null  // null for guest accounts
  avatarUrl: string | null
  isGuest:   boolean
  createdAt: string         // ISO 8601
}

// ─── Collaborator (user + session-scoped metadata) ───────────────────────────

export interface Collaborator {
  userId:    UserId
  sessionId: SessionId
  name:      string
  initial:   string         // first letter of name, used for avatar
  color:     string         // hex, assigned at join time, stored server-side per (userId, sessionId)
  role:      Role
  joinedAt:  string         // ISO 8601
}

// ─── Session ──────────────────────────────────────────────────────────────────

export interface Session {
  id:           SessionId
  name:         string
  bpm:          number       // 40–300
  timeSignatureNumerator:   number  // e.g. 4
  timeSignatureDenominator: number  // e.g. 4
  totalBars:    number
  createdBy:    UserId
  createdAt:    string       // ISO 8601
  updatedAt:    string       // ISO 8601
  collaborators: Collaborator[]
}

// Transport state is server-authoritative and broadcast on every change.
// Stored in memory on prototype; needs Redis or equivalent in production.
export interface TransportState {
  sessionId:   SessionId
  playing:     boolean
  recording:   boolean
  playheadBar: BarPosition   // authoritative position at the moment of last event
  syncedAt:    number        // server Unix ms timestamp — client applies drift correction
  bpm:         number
}

// ─── Track ────────────────────────────────────────────────────────────────────

export interface Track {
  id:          TrackId
  sessionId:   SessionId
  name:        string
  type:        TrackType
  ownerId:     UserId
  armed:       boolean
  muted:       boolean
  soloed:      boolean
  volume:      number        // 0–100 (maps to fader position; server computes dB)
  pan:         number        // -100 to 100, 0 = center
  order:       number        // integer sort order within session
  pluginChainId: PluginChainId | null
  // Routing: for Bus tracks, inputTrackIds lists which tracks feed into this bus.
  // For Audio/MIDI tracks this is empty.
  inputTrackIds: TrackId[]
  lockedBy:    UserId | null  // null = unlocked; set server-side when a user arms for record
  createdAt:   string
  updatedAt:   string
}

// ─── Clip ─────────────────────────────────────────────────────────────────────

export interface Clip {
  id:           ClipId
  trackId:      TrackId
  sessionId:    SessionId
  label:        string
  bar:          BarPosition   // start position, zero-indexed
  len:          number        // length in bars
  fadeIn:       number        // bars
  fadeOut:      number        // bars
  fadeInCurve:  FadeCurve
  fadeOutCurve: FadeCurve
  // For Audio clips: reference to a stored PCM asset
  assetId:      AssetId | null
  // For MIDI clips: opaque JSON blob (note events, CC etc.)
  // Do not attempt to parse on backend in prototype; store and return verbatim.
  midiData:     MidiDataBlob | null
  // Bounce provenance: if this Audio clip was rendered from a MIDI clip
  bouncedFromClipId: ClipId | null
  bouncePreset:      string | null   // e.g. "Rhodes Warm"
  bounceInstrumentId: string | null  // maps to VIRTUAL_INSTRUMENTS id
  bounceHumanStyle:   string | null  // maps to HUMANIZER_STYLES id
  createdAt:    string
  updatedAt:    string
}

// Opaque — frontend owns the schema; backend stores and echoes
export type MidiDataBlob = Record<string, unknown>

// ─── Audio Asset ──────────────────────────────────────────────────────────────

// Represents a stored PCM recording or imported sample.
// Blob lives in object storage (S3-compatible); this record is the DB row.
export interface AudioAsset {
  id:           AssetId
  sessionId:    SessionId
  uploadedBy:   UserId
  filename:     string
  sampleRate:   number        // e.g. 44100, 48000
  bitDepth:     number        // 24 for recorded clips; 16/24/32 for imports
  channels:     number        // 1 = mono, 2 = stereo
  durationSec:  number
  sizeBytes:    number
  storageKey:   string        // opaque path within the bucket — never expose raw S3 URLs
  // Client downloads via signed URL from GET /api/v1/assets/:id/download
  createdAt:    string
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

// Plugin type registry — extensible, not an enum
export type PluginType = 'compressor' | 'reverb' | 'delay' | 'maximizer' | 'eq' | string

export interface Plugin {
  id:         PluginId
  chainId:    PluginChainId
  type:       PluginType
  name:       string          // display name, e.g. "Compressor"
  enabled:    boolean
  order:      number          // slot position within chain, 0-indexed
  // All parameter values are opaque key-value pairs.
  // This avoids breaking schema changes when new plugin types are added.
  // Example: { threshold: -18, ratio: 4, attack: 10, release: 100 }
  params:     Record<string, number | string | boolean>
  createdAt:  string
  updatedAt:  string
}

export interface PluginChain {
  id:       PluginChainId
  // A chain belongs to exactly one track OR the master bus (trackId null = master)
  trackId:  TrackId | null
  sessionId: SessionId
  plugins:  Plugin[]
}

// ─── Presence ─────────────────────────────────────────────────────────────────

// Sent by clients on a throttled interval (100ms) and on meaningful state changes.
// Server fans out to all other clients in the session. NOT persisted to DB.
export interface CollaboratorPresence {
  userId:      UserId
  sessionId:   SessionId
  online:      boolean
  playheadBar: BarPosition   // where this collaborator's cursor is in the timeline
  activeTrackId: TrackId | null
  isRecording: boolean
  color:       string        // echo of Collaborator.color for rendering
  lastSeenAt:  number        // server Unix ms, set by server on receipt
}

// ─── Audio I/O (prototype-level, not persisted) ───────────────────────────────

// Describes a physical or virtual audio device input channel.
// Populated by the client based on Web Audio API / browser media device enumeration.
// The server treats this as an opaque document — it only stores and echoes it.
export interface AudioInputDescriptor {
  deviceId:   string          // navigator.mediaDevices deviceId
  deviceLabel: string
  channelIndex: number        // 0-indexed within device
  driverType:  'CoreAudio' | 'ASIO' | 'JACK' | 'WebAudio' | 'Unknown'
}

// Per-track input routing assignment. Stored in DB.
export interface TrackInputAssignment {
  trackId:    TrackId
  sessionId:  SessionId
  input:      AudioInputDescriptor | null   // null = no input assigned
  monitorEnabled: boolean
}

// ─── WebSocket Messages ───────────────────────────────────────────────────────
// All WS frames are JSON-encoded WsMessage<T>.
// The `type` field is the discriminant; `payload` carries the event data.
// `from` is the userId of the sender; `seq` is a monotonically increasing
// integer per sender — lets the client detect dropped frames without OT.

export interface WsMessage<T> {
  type:      WsEventType
  payload:   T
  sessionId: SessionId
  from:      UserId
  seq:       number
  ts:        number    // server Unix ms timestamp
}

export type WsEventType =
  // Transport
  | 'transport.play'
  | 'transport.pause'
  | 'transport.stop'
  | 'transport.seek'
  | 'transport.bpm_change'
  | 'transport.record_start'
  | 'transport.record_stop'
  | 'transport.state_sync'       // server → all clients; authoritative full state snapshot

  // Track mutations (server echoes to all clients after write)
  | 'track.created'
  | 'track.updated'
  | 'track.deleted'
  | 'track.locked'               // record-arm acquired; other clients must not arm same track
  | 'track.unlocked'

  // Clip mutations
  | 'clip.created'
  | 'clip.updated'               // covers move, resize, fade change
  | 'clip.deleted'
  | 'clip.split'                 // cut tool: one clip becomes two

  // Plugin
  | 'plugin.param_change'        // real-time knob automation; high-frequency; throttle at 60 fps
  | 'plugin.chain_updated'       // add/remove/reorder plugins; lower frequency

  // Presence
  | 'presence.update'            // one collaborator's cursor/state
  | 'presence.joined'            // new user entered session
  | 'presence.left'              // user disconnected or left

  // Audio streaming (binary frames handled separately; these are signaling messages)
  | 'audio.chunk_ack'            // server → recording client: chunk N received OK
  | 'audio.chunk_error'          // server → recording client: chunk N failed, please resend

  // System
  | 'session.error'
  | 'session.snapshot'           // server → joining client: full current state on connect

// ─── WS Payload shapes ───────────────────────────────────────────────────────

export interface TransportPlayPayload {
  playheadBar: BarPosition
  bpm:         number
}

export interface TransportSeekPayload {
  playheadBar: BarPosition
}

export interface TransportBpmChangePayload {
  bpm: number
}

export interface TransportStateSyncPayload extends TransportState {}

export interface TrackCreatedPayload  { track: Track }
export interface TrackUpdatedPayload  { trackId: TrackId; changes: Partial<Track> }
export interface TrackDeletedPayload  { trackId: TrackId }
export interface TrackLockedPayload   { trackId: TrackId; lockedBy: UserId }
export interface TrackUnlockedPayload { trackId: TrackId }

export interface ClipCreatedPayload { clip: Clip }
export interface ClipUpdatedPayload { clipId: ClipId; changes: Partial<Clip> }
export interface ClipDeletedPayload { clipId: ClipId; trackId: TrackId }
export interface ClipSplitPayload   {
  originalClipId: ClipId
  leftClip:       Clip
  rightClip:      Clip
}

export interface PluginParamChangePayload {
  pluginId:  PluginId
  chainId:   PluginChainId
  paramKey:  string
  value:     number | string | boolean
}

export interface PluginChainUpdatedPayload {
  chain: PluginChain
}

export interface PresenceUpdatePayload extends CollaboratorPresence {}

export interface PresenceJoinedPayload {
  collaborator: Collaborator
  presence:     CollaboratorPresence
}

export interface PresenceLeftPayload {
  userId: UserId
}

export interface AudioChunkAckPayload {
  trackId:    TrackId
  chunkIndex: number
}

export interface AudioChunkErrorPayload {
  trackId:    TrackId
  chunkIndex: number
  reason:     string
}

// Full snapshot sent to a client immediately after joining a session
export interface SessionSnapshotPayload {
  session:      Session
  transport:    TransportState
  tracks:       Track[]
  clips:        Clip[]
  pluginChains: PluginChain[]
  presence:     CollaboratorPresence[]
  collaborators: Collaborator[]
}

// ─── REST Request Bodies ──────────────────────────────────────────────────────

export interface CreateSessionBody {
  name:                     string
  bpm:                      number
  timeSignatureNumerator:   number
  timeSignatureDenominator: number
  totalBars:                number
}

export interface JoinSessionBody {
  // For authenticated users, identity comes from JWT; this carries only prefs
  displayName?: string       // override; defaults to user.name
}

export interface GuestJoinBody {
  displayName: string
}

export interface CreateTrackBody {
  name:    string
  type:    TrackType
  order?:  number
}

export interface UpdateTrackBody {
  name?:   string
  muted?:  boolean
  soloed?: boolean
  volume?: number
  pan?:    number
  order?:  number
  inputTrackIds?: TrackId[]
}

export interface CreateClipBody {
  trackId:      TrackId
  label:        string
  bar:          BarPosition
  len:          number
  fadeIn?:      number
  fadeOut?:     number
  fadeInCurve?: FadeCurve
  fadeOutCurve?: FadeCurve
  assetId?:     AssetId
  midiData?:    MidiDataBlob
}

export interface UpdateClipBody {
  label?:       string
  bar?:         BarPosition
  len?:         number
  fadeIn?:      number
  fadeOut?:     number
  fadeInCurve?: FadeCurve
  fadeOutCurve?: FadeCurve
}

export interface SplitClipBody {
  cutBar: BarPosition
}

export interface BounceClipBody {
  instrumentId:  string
  preset:        string
  humanStyle:    string | null
  targetTrackId?: TrackId   // if omitted, server creates a new Audio track
}

export interface UpdatePluginParamsBody {
  params: Record<string, number | string | boolean>
}

export interface UpdatePluginChainBody {
  plugins: Array<{
    id?:      PluginId     // omit for new plugins
    type:     PluginType
    enabled:  boolean
    order:    number
    params:   Record<string, number | string | boolean>
  }>
}

// ─── Audio upload (multipart or chunked) ──────────────────────────────────────

// Client initiates a recording upload via POST /api/v1/assets/upload/init
export interface AudioUploadInitBody {
  sessionId:   SessionId
  trackId:     TrackId
  filename:    string
  sampleRate:  number
  bitDepth:    number
  channels:    number
  totalChunks: number     // client declares upfront how many 512KB chunks to send
}

export interface AudioUploadInitResponse {
  uploadId:   string      // opaque ID; included in each subsequent chunk PUT
  assetId:    AssetId     // pre-assigned; clip can reference it before upload completes
}
