/**
 * server/storage/adapter.ts
 *
 * StorageAdapter interface — the contract that both InMemoryStorageAdapter and
 * PrismaStorageAdapter must satisfy. Route handlers depend on this interface only;
 * they are unaware of the concrete implementation.
 *
 * Source of truth for Sprint 5 persistence layer (ADR-004).
 */

import type { SessionComment } from '../types';

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------
// These are transport shapes — not Prisma internals, not server/types.ts domain
// objects. They map 1:1 to table columns that callers care about.

export interface SessionRow {
  id: string;
  name: string;
  bpm: number;
  timeSignature: { numerator: number; denominator: number };
  totalBars: number;
}

export interface TrackRow {
  id: string;
  sessionId: string;
  name: string;
  ownerId: string;
  color: string;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  armed: boolean;
}

export interface ClipRow {
  id: string;
  trackId: string;
  sessionId: string;
  startBar: number;
  durationBars: number;
  assetId: string | null;
  color: string;
}

export interface AudioFileRow {
  id: string;
  sessionId: string;
  uploaderId: string;
  s3StreamKey: string;
  s3FullKey: string | null;
  mimeType: string;
  durationSec: number;
  sampleRate: number;
  channels: number;
  fileSizeBytes: bigint;
  /** 200-value RMS waveform peaks — server-generated at upload time (ADR-006). Empty array = no peaks. */
  peaks: number[];
}

// ---------------------------------------------------------------------------
// CommentReplyData
// ---------------------------------------------------------------------------

/** The minimal shape of a newly created reply — returned alongside the updated
 *  parent comment so callers don't have to diff the replies[] array to find it. */
export interface CommentReplyData {
  id: string;
  commentId: string;
  authorId: string;
  body: string;
  createdAt: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// StorageAdapter
// ---------------------------------------------------------------------------

export interface StorageAdapter {
  // Session
  getSession(id: string): Promise<SessionRow | null>;
  createSession(data: Omit<SessionRow, 'id'>): Promise<SessionRow>;

  // Tracks
  getTracks(sessionId: string): Promise<TrackRow[]>;
  createTrack(data: Omit<TrackRow, 'id'>): Promise<TrackRow>;
  updateTrack(id: string, patch: Partial<Omit<TrackRow, 'id' | 'sessionId'>>): Promise<TrackRow>;

  // Clips
  getClips(sessionId: string): Promise<ClipRow[]>;
  createClip(data: Omit<ClipRow, 'id'>): Promise<ClipRow>;
  updateClip(id: string, patch: Partial<Omit<ClipRow, 'id' | 'sessionId' | 'trackId'>>): Promise<ClipRow>;

  // Comments — return shapes must match server/types.ts SessionComment
  getComments(sessionId: string): Promise<SessionComment[]>;
  addComment(sessionId: string, comment: Omit<SessionComment, 'id' | 'createdAt' | 'replies'>): Promise<SessionComment>;
  resolveComment(sessionId: string, commentId: string, resolvedBy: string): Promise<SessionComment | null>;
  reopenComment(sessionId: string, commentId: string): Promise<SessionComment | null>;
  addReply(sessionId: string, commentId: string, reply: { authorId: string; body: string }): Promise<{ comment: SessionComment; newReply: CommentReplyData } | null>;
  deleteComment(sessionId: string, commentId: string): Promise<SessionComment | null>;

  // AudioFile
  createAudioFile(data: Omit<AudioFileRow, 'id'>): Promise<AudioFileRow>;
  getAudioFile(id: string): Promise<AudioFileRow | null>;

  // Session membership
  getSessionMember(userId: string, sessionId: string): Promise<{ role: string } | null>;

  // Lifecycle
  close?(): Promise<void>;
}
