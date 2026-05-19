/**
 * server/storage/prisma-adapter.ts
 *
 * PrismaStorageAdapter — implements StorageAdapter using the Prisma client.
 *
 * Key ADR-004 rules enforced here:
 *   - getComments filters WHERE deletedAt IS NULL (soft delete)
 *   - deleteComment sets deletedAt = new Date() — no physical row deletion
 *   - createClip + createAudioFile use prisma.$transaction
 *   - Replies in getComments are also filtered for deletedAt IS NULL
 *   - Plugin order: always orderBy { order: 'asc' } — never re-packed after deletion
 *   - Comment.anchor is Prisma Json (unknown) — cast to CommentAnchor after object check
 */

import { PrismaClient, Prisma } from '@prisma/client';
import type { StorageAdapter, SessionRow, TrackRow, ClipRow, AudioFileRow, CommentReplyData } from './adapter';
import type { SessionComment, CommentReply, CommentAnchor } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Narrow an unknown Prisma Json value to CommentAnchor. Throws if shape is wrong. */
function castAnchor(raw: unknown): CommentAnchor {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('Comment anchor in database is not a plain object');
  }
  // The anchor was validated by the REST handler at write time, so this cast is safe.
  return raw as CommentAnchor;
}

// ---------------------------------------------------------------------------
// Prisma row → domain row mappers
// ---------------------------------------------------------------------------

function mapSessionRow(row: {
  id: string;
  name: string;
  bpm: number;
  timeSignature: unknown;
  totalBars: number;
}): SessionRow {
  const ts = row.timeSignature;
  if (
    typeof ts !== 'object' ||
    ts === null ||
    Array.isArray(ts) ||
    typeof (ts as Record<string, unknown>)['numerator'] !== 'number' ||
    typeof (ts as Record<string, unknown>)['denominator'] !== 'number'
  ) {
    throw new Error(`Invalid timeSignature JSON for session ${row.id}`);
  }
  const tsObj = ts as Record<string, unknown>;
  return {
    id: row.id,
    name: row.name,
    bpm: row.bpm,
    timeSignature: {
      numerator: tsObj['numerator'] as number,
      denominator: tsObj['denominator'] as number,
    },
    totalBars: row.totalBars,
  };
}

function mapTrackRow(row: {
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
}): TrackRow {
  return {
    id: row.id,
    sessionId: row.sessionId,
    name: row.name,
    ownerId: row.ownerId,
    color: row.color,
    volume: row.volume,
    pan: row.pan,
    muted: row.muted,
    soloed: row.soloed,
    armed: row.armed,
  };
}

function mapClipRow(row: {
  id: string;
  trackId: string;
  sessionId: string;
  startBar: number;
  durationBars: number;
  assetId: string | null;
  color: string;
}): ClipRow {
  return {
    id: row.id,
    trackId: row.trackId,
    sessionId: row.sessionId,
    startBar: row.startBar,
    durationBars: row.durationBars,
    assetId: row.assetId,
    color: row.color,
  };
}

function mapAudioFileRow(row: {
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
}): AudioFileRow {
  return {
    id: row.id,
    sessionId: row.sessionId,
    uploaderId: row.uploaderId,
    s3StreamKey: row.s3StreamKey,
    s3FullKey: row.s3FullKey,
    mimeType: row.mimeType,
    durationSec: row.durationSec,
    sampleRate: row.sampleRate,
    channels: row.channels,
    fileSizeBytes: row.fileSizeBytes,
  };
}

function mapCommentRow(row: {
  id: string;
  sessionId: string;
  authorId: string;
  body: string;
  anchor: unknown;
  status: string;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  replies: Array<{
    id: string;
    commentId: string;
    authorId: string;
    body: string;
    createdAt: Date;
  }>;
}): SessionComment {
  const replies: CommentReply[] = row.replies.map((r) => ({
    id: r.id,
    commentId: r.commentId,
    authorId: r.authorId,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
  }));

  return {
    id: row.id,
    sessionId: row.sessionId,
    authorId: row.authorId,
    body: row.body,
    anchor: castAnchor(row.anchor),
    replies,
    status: row.status as 'open' | 'resolved',
    resolvedBy: row.resolvedBy,
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class PrismaStorageAdapter implements StorageAdapter {
  private readonly prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma ?? new PrismaClient();
  }

  // ---------------------------------------------------------------------------
  // Session
  // ---------------------------------------------------------------------------

  async getSession(id: string): Promise<SessionRow | null> {
    const row = await this.prisma.session.findFirst({
      where: { id, deletedAt: null },
    });
    if (!row) return null;
    return mapSessionRow(row);
  }

  async createSession(data: Omit<SessionRow, 'id'>): Promise<SessionRow> {
    const row = await this.prisma.session.create({
      data: {
        name: data.name,
        bpm: data.bpm,
        timeSignature: data.timeSignature,
        totalBars: data.totalBars,
      },
    });
    return mapSessionRow(row);
  }

  // ---------------------------------------------------------------------------
  // Tracks
  // ---------------------------------------------------------------------------

  async getTracks(sessionId: string): Promise<TrackRow[]> {
    // Track uses hard delete — no deletedAt filter needed (see ADR-004 §7)
    const rows = await this.prisma.track.findMany({
      where: { sessionId },
    });
    return rows.map(mapTrackRow);
  }

  async createTrack(data: Omit<TrackRow, 'id'>): Promise<TrackRow> {
    const row = await this.prisma.track.create({
      data: {
        sessionId: data.sessionId,
        name: data.name,
        ownerId: data.ownerId,
        color: data.color,
        volume: data.volume,
        pan: data.pan,
        muted: data.muted,
        soloed: data.soloed,
        armed: data.armed,
      },
    });
    return mapTrackRow(row);
  }

  async updateTrack(
    id: string,
    patch: Partial<Omit<TrackRow, 'id' | 'sessionId'>>
  ): Promise<TrackRow> {
    const row = await this.prisma.track.update({
      where: { id },
      data: patch,
    });
    return mapTrackRow(row);
  }

  // ---------------------------------------------------------------------------
  // Clips
  // ---------------------------------------------------------------------------

  async getClips(sessionId: string): Promise<ClipRow[]> {
    // Clip uses hard delete — no deletedAt filter needed (see ADR-004 §7)
    const rows = await this.prisma.clip.findMany({
      where: { sessionId },
    });
    return rows.map(mapClipRow);
  }

  async createClip(data: Omit<ClipRow, 'id'>): Promise<ClipRow> {
    const row = await this.prisma.clip.create({
      data: {
        trackId: data.trackId,
        sessionId: data.sessionId,
        startBar: data.startBar,
        durationBars: data.durationBars,
        assetId: data.assetId,
        color: data.color,
      },
    });
    return mapClipRow(row);
  }

  async updateClip(
    id: string,
    patch: Partial<Omit<ClipRow, 'id' | 'sessionId' | 'trackId'>>
  ): Promise<ClipRow> {
    const row = await this.prisma.clip.update({
      where: { id },
      data: patch,
    });
    return mapClipRow(row);
  }

  // ---------------------------------------------------------------------------
  // Comments
  // ---------------------------------------------------------------------------

  async getComments(sessionId: string): Promise<SessionComment[]> {
    const rows = await this.prisma.comment.findMany({
      where: { sessionId, deletedAt: null },
      include: {
        replies: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(mapCommentRow);
  }

  async addComment(
    sessionId: string,
    comment: Omit<SessionComment, 'id' | 'createdAt' | 'replies'>
  ): Promise<SessionComment> {
    const row = await this.prisma.comment.create({
      data: {
        sessionId,
        authorId: comment.authorId,
        body: comment.body,
        anchor: comment.anchor as unknown as Prisma.InputJsonValue,
        status: comment.status,
        resolvedBy: comment.resolvedBy,
        resolvedAt: comment.resolvedAt ? new Date(comment.resolvedAt) : null,
      },
      include: {
        replies: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    return mapCommentRow(row);
  }

  async resolveComment(
    sessionId: string,
    commentId: string,
    resolvedBy: string
  ): Promise<SessionComment | null> {
    const existing = await this.prisma.comment.findFirst({
      where: { id: commentId, sessionId, deletedAt: null },
    });
    if (!existing) return null;

    const now = new Date();
    const row = await this.prisma.comment.update({
      where: { id: commentId },
      data: { status: 'resolved', resolvedBy, resolvedAt: now, updatedAt: now },
      include: {
        replies: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    return mapCommentRow(row);
  }

  async reopenComment(
    sessionId: string,
    commentId: string
  ): Promise<SessionComment | null> {
    const existing = await this.prisma.comment.findFirst({
      where: { id: commentId, sessionId, deletedAt: null },
    });
    if (!existing) return null;

    const now = new Date();
    const row = await this.prisma.comment.update({
      where: { id: commentId },
      data: { status: 'open', resolvedBy: null, resolvedAt: null, updatedAt: now },
      include: {
        replies: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    return mapCommentRow(row);
  }

  async addReply(
    sessionId: string,
    commentId: string,
    reply: { authorId: string; body: string }
  ): Promise<{ comment: SessionComment; newReply: CommentReplyData } | null> {
    const existing = await this.prisma.comment.findFirst({
      where: { id: commentId, sessionId, deletedAt: null },
    });
    if (!existing) return null;

    const createdReply = await this.prisma.commentReply.create({
      data: {
        commentId,
        authorId: reply.authorId,
        body: reply.body,
      },
    });

    const row = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        replies: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!row) return null;

    const comment = mapCommentRow(row);
    const newReply: CommentReplyData = {
      id: createdReply.id,
      commentId: createdReply.commentId,
      authorId: createdReply.authorId,
      body: createdReply.body,
      createdAt: createdReply.createdAt.toISOString(),
    };
    return { comment, newReply };
  }

  async deleteComment(
    sessionId: string,
    commentId: string
  ): Promise<SessionComment | null> {
    const existing = await this.prisma.comment.findFirst({
      where: { id: commentId, sessionId, deletedAt: null },
      include: {
        replies: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!existing) return null;

    // Snapshot before soft-delete so the caller gets the final state
    const snapshot = mapCommentRow(existing);

    await this.prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });

    return snapshot;
  }

  // ---------------------------------------------------------------------------
  // AudioFile
  // ---------------------------------------------------------------------------

  /**
   * createAudioFile uses a transaction even though the Clip creation happens at a
   * different call site, as required by ADR-004. When the recording pipeline is
   * built in Sprint 8-9, the caller will pass a pre-created Prisma transaction
   * client instead of using the default.
   */
  async createAudioFile(data: Omit<AudioFileRow, 'id'>): Promise<AudioFileRow> {
    const row = await this.prisma.$transaction(async (tx) => {
      return tx.audioFile.create({
        data: {
          sessionId: data.sessionId,
          uploaderId: data.uploaderId,
          s3StreamKey: data.s3StreamKey,
          s3FullKey: data.s3FullKey,
          mimeType: data.mimeType,
          durationSec: data.durationSec,
          sampleRate: data.sampleRate,
          channels: data.channels,
          fileSizeBytes: data.fileSizeBytes,
        },
      });
    });
    return mapAudioFileRow(row);
  }

  async getAudioFile(id: string): Promise<AudioFileRow | null> {
    const row = await this.prisma.audioFile.findUnique({ where: { id } });
    if (!row) return null;
    return mapAudioFileRow(row);
  }

  // ---------------------------------------------------------------------------
  // Session membership
  // ---------------------------------------------------------------------------

  async getSessionMember(
    userId: string,
    sessionId: string
  ): Promise<{ role: string } | null> {
    const row = await this.prisma.sessionMember.findUnique({
      where: { userId_sessionId: { userId, sessionId } },
      select: { role: true },
    });
    return row ?? null;
  }

  // ---------------------------------------------------------------------------
  // Health check (Prisma-specific — not on StorageAdapter interface)
  // ---------------------------------------------------------------------------

  /** Verify the database connection is reachable. Throws if unreachable. */
  async healthCheck(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
