/**
 * server/storage/memory-adapter.ts
 *
 * InMemoryStorageAdapter — implements StorageAdapter using in-memory Maps.
 *
 * Comment operations delegate to server/store.ts (which owns the SessionState.comments
 * arrays). Session, Track, Clip, and AudioFile operations use local Maps — store.ts
 * has no equivalent helpers for those entities.
 *
 * Use this adapter for local dev without a database and for unit tests.
 */

import { randomUUID } from 'crypto';
import type { StorageAdapter, SessionRow, TrackRow, ClipRow, AudioFileRow, CommentReplyData } from './adapter';
import type { SessionComment, CommentReply } from '../types';
import {
  addComment as storeAddComment,
  getComments as storeGetComments,
  resolveComment as storeResolveComment,
  reopenComment as storeReopenComment,
  addReply as storeAddReply,
  deleteComment as storeDeleteComment,
} from '../store';

// ---------------------------------------------------------------------------
// In-memory stores (not shared with store.ts SessionState)
// ---------------------------------------------------------------------------

const sessions = new Map<string, SessionRow>();
const tracks = new Map<string, TrackRow>();
const clips = new Map<string, ClipRow>();
const audioFiles = new Map<string, AudioFileRow>();

// ---------------------------------------------------------------------------
// Adapter implementation
// ---------------------------------------------------------------------------

export class InMemoryStorageAdapter implements StorageAdapter {
  // ---------------------------------------------------------------------------
  // Session
  // ---------------------------------------------------------------------------

  async getSession(id: string): Promise<SessionRow | null> {
    return sessions.get(id) ?? null;
  }

  async createSession(data: Omit<SessionRow, 'id'>): Promise<SessionRow> {
    const row: SessionRow = { id: randomUUID(), ...data };
    sessions.set(row.id, row);
    return row;
  }

  // ---------------------------------------------------------------------------
  // Tracks
  // ---------------------------------------------------------------------------

  async getTracks(sessionId: string): Promise<TrackRow[]> {
    const result: TrackRow[] = [];
    for (const track of tracks.values()) {
      if (track.sessionId === sessionId) result.push(track);
    }
    return result;
  }

  async createTrack(data: Omit<TrackRow, 'id'>): Promise<TrackRow> {
    const row: TrackRow = { id: randomUUID(), ...data };
    tracks.set(row.id, row);
    return row;
  }

  async updateTrack(
    id: string,
    patch: Partial<Omit<TrackRow, 'id' | 'sessionId'>>
  ): Promise<TrackRow> {
    const existing = tracks.get(id);
    if (!existing) throw new Error(`Track not found: ${id}`);
    const updated: TrackRow = { ...existing, ...patch };
    tracks.set(id, updated);
    return updated;
  }

  // ---------------------------------------------------------------------------
  // Clips
  // ---------------------------------------------------------------------------

  async getClips(sessionId: string): Promise<ClipRow[]> {
    const result: ClipRow[] = [];
    for (const clip of clips.values()) {
      if (clip.sessionId === sessionId) result.push(clip);
    }
    return result;
  }

  async createClip(data: Omit<ClipRow, 'id'>): Promise<ClipRow> {
    const row: ClipRow = { id: randomUUID(), ...data };
    clips.set(row.id, row);
    return row;
  }

  async updateClip(
    id: string,
    patch: Partial<Omit<ClipRow, 'id' | 'sessionId' | 'trackId'>>
  ): Promise<ClipRow> {
    const existing = clips.get(id);
    if (!existing) throw new Error(`Clip not found: ${id}`);
    const updated: ClipRow = { ...existing, ...patch };
    clips.set(id, updated);
    return updated;
  }

  // ---------------------------------------------------------------------------
  // Comments — delegate to store.ts
  // ---------------------------------------------------------------------------

  async getComments(sessionId: string): Promise<SessionComment[]> {
    return storeGetComments(sessionId);
  }

  async addComment(
    sessionId: string,
    comment: Omit<SessionComment, 'id' | 'createdAt' | 'replies'>
  ): Promise<SessionComment> {
    const now = new Date().toISOString();
    const full: SessionComment = {
      ...comment,
      id: randomUUID(),
      sessionId,
      replies: [],
      createdAt: now,
    };
    storeAddComment(sessionId, full);
    return full;
  }

  async resolveComment(
    sessionId: string,
    commentId: string,
    resolvedBy: string
  ): Promise<SessionComment | null> {
    return storeResolveComment(sessionId, commentId, resolvedBy) ?? null;
  }

  async reopenComment(
    sessionId: string,
    commentId: string
  ): Promise<SessionComment | null> {
    return storeReopenComment(sessionId, commentId) ?? null;
  }

  async addReply(
    sessionId: string,
    commentId: string,
    reply: { authorId: string; body: string }
  ): Promise<{ comment: SessionComment; newReply: CommentReplyData } | null> {
    const replyObj: CommentReply = {
      id: randomUUID(),
      commentId,
      authorId: reply.authorId,
      body: reply.body,
      createdAt: new Date().toISOString(),
    };
    const comment = storeAddReply(sessionId, commentId, replyObj);
    if (!comment) return null;
    const newReply: CommentReplyData = {
      id: replyObj.id,
      commentId: replyObj.commentId,
      authorId: replyObj.authorId,
      body: replyObj.body,
      createdAt: replyObj.createdAt,
    };
    return { comment, newReply };
  }

  async deleteComment(
    sessionId: string,
    commentId: string
  ): Promise<SessionComment | null> {
    return storeDeleteComment(sessionId, commentId) ?? null;
  }

  // ---------------------------------------------------------------------------
  // AudioFile
  // ---------------------------------------------------------------------------

  async createAudioFile(data: Omit<AudioFileRow, 'id'>): Promise<AudioFileRow> {
    const row: AudioFileRow = { id: randomUUID(), ...data };
    audioFiles.set(row.id, row);
    return row;
  }

  async getAudioFile(id: string): Promise<AudioFileRow | null> {
    return audioFiles.get(id) ?? null;
  }

  // ---------------------------------------------------------------------------
  // Session membership
  // ---------------------------------------------------------------------------

  // The in-memory adapter has no concept of session membership (there is no
  // authentication in the local dev mode that uses this adapter). Always return
  // a permissive member record so audio routes are exercisable without a DB.
  async getSessionMember(
    _userId: string,
    _sessionId: string
  ): Promise<{ role: string } | null> {
    return { role: 'owner' };
  }

  // ---------------------------------------------------------------------------
  // Test / dev utilities
  // ---------------------------------------------------------------------------

  /** Clear all in-memory Maps. Useful for test isolation.
   *  Note: comment state is owned by store.ts (module singleton) and is NOT
   *  reset here — call store helpers directly if test needs comment teardown. */
  reset(): void {
    sessions.clear();
    tracks.clear();
    clips.clear();
    audioFiles.clear();
  }
}
