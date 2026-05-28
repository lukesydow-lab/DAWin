/**
 * tests/unit/server/memory-adapter.test.ts
 *
 * Unit tests for InMemoryStorageAdapter.
 *
 * NOTE: The InMemoryStorageAdapter is a pure in-memory class that uses Node's
 * built-in 'crypto' module and delegates comment operations to server/store.ts.
 * These tests run via Vitest in the jsdom environment with Node globals.
 *
 * The adapter lives at server/storage/memory-adapter.ts and imports from
 * server/store.ts using .js extensions (required by the server's ESM config).
 * Vitest resolves .ts files for .js import paths when running from the root.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryStorageAdapter } from '../../../server/storage/memory-adapter'

describe('InMemoryStorageAdapter', () => {
  let adapter: InMemoryStorageAdapter

  beforeEach(() => {
    adapter = new InMemoryStorageAdapter()
    adapter.reset()
  })

  // ---------------------------------------------------------------------------
  // Session
  // ---------------------------------------------------------------------------

  describe('sessions', () => {
    it('creates a session and retrieves it by id', async () => {
      const session = await adapter.createSession({
        name: 'Test Session',
        bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 },
        totalBars: 32,
      })

      expect(session.id).toBeTruthy()
      expect(session.name).toBe('Test Session')
      expect(session.bpm).toBe(120)
      expect(session.timeSignature).toEqual({ numerator: 4, denominator: 4 })
      expect(session.totalBars).toBe(32)

      const retrieved = await adapter.getSession(session.id)
      expect(retrieved).toEqual(session)
    })

    it('returns null for an unknown session id', async () => {
      const result = await adapter.getSession('nonexistent-id')
      expect(result).toBeNull()
    })

    it('assigns a unique id to each created session', async () => {
      const s1 = await adapter.createSession({
        name: 'Session A', bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 }, totalBars: 16,
      })
      const s2 = await adapter.createSession({
        name: 'Session B', bpm: 140,
        timeSignature: { numerator: 3, denominator: 4 }, totalBars: 24,
      })

      expect(s1.id).not.toBe(s2.id)
    })
  })

  // ---------------------------------------------------------------------------
  // Tracks
  // ---------------------------------------------------------------------------

  describe('tracks', () => {
    it('creates a track linked to a session and retrieves it', async () => {
      const session = await adapter.createSession({
        name: 'Track Test Session', bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 }, totalBars: 32,
      })

      const track = await adapter.createTrack({
        sessionId: session.id,
        name: 'Drums',
        ownerId: 'user-1',
        color: '#ff4444',
        volume: 100,
        pan: 0,
        muted: false,
        soloed: false,
        armed: false,
      })

      expect(track.id).toBeTruthy()
      expect(track.sessionId).toBe(session.id)
      expect(track.name).toBe('Drums')

      const tracks = await adapter.getTracks(session.id)
      expect(tracks).toHaveLength(1)
      expect(tracks[0]).toEqual(track)
    })

    it('returns empty array for session with no tracks', async () => {
      const session = await adapter.createSession({
        name: 'Empty Session', bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 }, totalBars: 32,
      })

      const tracks = await adapter.getTracks(session.id)
      expect(tracks).toHaveLength(0)
    })

    it('only returns tracks belonging to the requested session', async () => {
      const s1 = await adapter.createSession({
        name: 'S1', bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 }, totalBars: 16,
      })
      const s2 = await adapter.createSession({
        name: 'S2', bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 }, totalBars: 16,
      })

      await adapter.createTrack({
        sessionId: s1.id, name: 'Track A', ownerId: 'u1',
        color: '#ff0000', volume: 100, pan: 0,
        muted: false, soloed: false, armed: false,
      })
      await adapter.createTrack({
        sessionId: s2.id, name: 'Track B', ownerId: 'u1',
        color: '#00ff00', volume: 100, pan: 0,
        muted: false, soloed: false, armed: false,
      })

      const s1Tracks = await adapter.getTracks(s1.id)
      expect(s1Tracks).toHaveLength(1)
      expect(s1Tracks[0].name).toBe('Track A')

      const s2Tracks = await adapter.getTracks(s2.id)
      expect(s2Tracks).toHaveLength(1)
      expect(s2Tracks[0].name).toBe('Track B')
    })

    it('updates a track with a patch', async () => {
      const session = await adapter.createSession({
        name: 'S', bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 }, totalBars: 32,
      })
      const track = await adapter.createTrack({
        sessionId: session.id, name: 'Bass', ownerId: 'u1',
        color: '#0000ff', volume: 80, pan: -10,
        muted: false, soloed: false, armed: false,
      })

      const updated = await adapter.updateTrack(track.id, { volume: 60, muted: true })
      expect(updated.volume).toBe(60)
      expect(updated.muted).toBe(true)
      expect(updated.pan).toBe(-10) // unchanged
      expect(updated.name).toBe('Bass') // unchanged
    })

    it('throws when updating a non-existent track', async () => {
      await expect(
        adapter.updateTrack('no-such-track', { volume: 50 })
      ).rejects.toThrow('Track not found')
    })
  })

  // ---------------------------------------------------------------------------
  // Session membership
  // ---------------------------------------------------------------------------

  describe('getSessionMember', () => {
    it('always returns an owner role (permissive local dev mode)', async () => {
      const member = await adapter.getSessionMember('any-user', 'any-session')
      expect(member).toEqual({ role: 'owner' })
    })
  })

  // ---------------------------------------------------------------------------
  // AudioFile
  // ---------------------------------------------------------------------------

  describe('audioFiles', () => {
    it('creates and retrieves an audio file', async () => {
      const session = await adapter.createSession({
        name: 'Audio Test', bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 }, totalBars: 32,
      })

      const audioFile = await adapter.createAudioFile({
        sessionId: session.id,
        uploaderId: 'user-1',
        s3StreamKey: 'audio/test.mp3',
        s3FullKey: null,
        mimeType: 'audio/mpeg',
        durationSec: 120,
        sampleRate: 44100,
        channels: 2,
        fileSizeBytes: BigInt(1024 * 1024),
        peaks: [0.1, 0.5, 0.8, 0.3],
      })

      expect(audioFile.id).toBeTruthy()
      expect(audioFile.sessionId).toBe(session.id)
      expect(audioFile.peaks).toEqual([0.1, 0.5, 0.8, 0.3])

      const retrieved = await adapter.getAudioFile(audioFile.id)
      expect(retrieved).toEqual(audioFile)
    })

    it('returns null for unknown audio file id', async () => {
      const result = await adapter.getAudioFile('nonexistent')
      expect(result).toBeNull()
    })
  })

  // ---------------------------------------------------------------------------
  // reset()
  // ---------------------------------------------------------------------------

  describe('reset()', () => {
    it('clears all sessions and tracks', async () => {
      const session = await adapter.createSession({
        name: 'Temporary', bpm: 100,
        timeSignature: { numerator: 4, denominator: 4 }, totalBars: 8,
      })
      await adapter.createTrack({
        sessionId: session.id, name: 'T', ownerId: 'u',
        color: '#fff', volume: 100, pan: 0,
        muted: false, soloed: false, armed: false,
      })

      adapter.reset()

      const retrieved = await adapter.getSession(session.id)
      expect(retrieved).toBeNull()

      const tracks = await adapter.getTracks(session.id)
      expect(tracks).toHaveLength(0)
    })
  })
})
