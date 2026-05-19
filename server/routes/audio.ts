/**
 * server/routes/audio.ts
 *
 * Audio file endpoints — Sprint 6 (6-C, 6-D).
 *
 * POST /api/v1/sessions/:sessionId/audio
 *   Upload a multipart audio file to Cloudflare R2.
 *   Creates an AudioFile DB row and returns it.
 *   Role: owner or collaborator only (viewer → 403).
 *
 * GET /api/v1/audio/:audioFileId/stream-url
 *   Returns a short-lived presigned R2 GetObject URL for the stream copy.
 *   Role: any session member (owner, collaborator, viewer).
 *
 * Auth: JWT Bearer token required on both endpoints.
 *
 * File size limit: 500MB (enforced at multipart parser level).
 * Supported MIME types: audio/wav, audio/ogg, audio/mpeg, audio/flac, audio/aac
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import multipart from '@fastify/multipart';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { parseBuffer } from 'music-metadata';
import { randomUUID } from 'crypto';
import { verifyToken } from '../jwt.js';
import { r2, R2_BUCKET } from '../r2.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

const ALLOWED_MIME_TYPES = new Set([
  'audio/wav',
  'audio/ogg',
  'audio/mpeg',
  'audio/flac',
  'audio/aac',
]);

/** Map a MIME type to a canonical file extension for S3 key naming. */
const MIME_TO_EXT: Record<string, string> = {
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/flac': 'flac',
  'audio/aac': 'aac',
};

/** Presigned URL TTL in seconds (1 hour). */
const STREAM_URL_TTL_SECONDS = 3600;

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

async function extractClaims(request: FastifyRequest) {
  const authHeader = request.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Route plugin
// ---------------------------------------------------------------------------

export async function audioRoutes(fastify: FastifyInstance): Promise<void> {
  // Register the multipart plugin scoped to this plugin only.
  // bodyLimit enforces the 500MB max before buffering completes.
  await fastify.register(multipart, {
    limits: {
      fileSize: MAX_FILE_SIZE_BYTES,
      files: 1,
    },
  });

  // -------------------------------------------------------------------------
  // POST /api/v1/sessions/:sessionId/audio
  //
  // Accepts: multipart/form-data with field "file" (audio binary).
  // Returns: AudioFileRow (fileSizeBytes serialized as string).
  // -------------------------------------------------------------------------

  fastify.post(
    '/api/v1/sessions/:sessionId/audio',
    async (
      request: FastifyRequest<{ Params: { sessionId: string } }>,
      reply: FastifyReply
    ) => {
      const claims = await extractClaims(request);
      if (!claims) {
        return reply
          .code(401)
          .send({ error: 'unauthorized', message: 'Missing or invalid Bearer token' });
      }
      if (claims.role === 'viewer') {
        return reply
          .code(403)
          .send({ error: 'forbidden', message: 'Viewers cannot upload audio files' });
      }

      const { sessionId } = request.params;

      // Verify the session exists.
      const session = await fastify.storage.getSession(sessionId);
      if (!session) {
        return reply
          .code(404)
          .send({ error: 'not_found', message: 'Session not found' });
      }

      // Parse the multipart body.
      let fileData: Buffer;
      let mimeType: string;

      try {
        const upload = await request.file();
        if (!upload) {
          return reply
            .code(400)
            .send({ error: 'bad_request', message: 'Missing file field in multipart body' });
        }

        // Read the full buffer. @fastify/multipart will throw a RequestFileTooLargeError
        // if the file exceeds the fileSize limit configured above.
        fileData = await upload.toBuffer();
        mimeType = upload.mimetype;
      } catch (err: unknown) {
        // @fastify/multipart emits a specific error code for size violations.
        const e = err as { code?: string };
        if (e?.code === 'FST_FILES_LIMIT' || e?.code === 'FST_REQ_FILE_TOO_LARGE') {
          return reply
            .code(413)
            .send({ error: 'payload_too_large', message: 'File exceeds 500MB limit' });
        }
        fastify.log.error({ err }, 'Multipart parse error');
        return reply
          .code(500)
          .send({ error: 'internal_error', message: 'Failed to parse upload' });
      }

      // Validate MIME type.
      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        return reply.code(415).send({
          error: 'unsupported_media_type',
          message: `Unsupported audio type: ${mimeType}. Allowed: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
        });
      }

      // Extract audio metadata (duration, sample rate, channels) from the buffer.
      // We trust the file content, not client-supplied values.
      let durationSec = 0;
      let sampleRate = 44100;
      let channels = 2;

      try {
        const metadata = await parseBuffer(fileData, { mimeType });
        durationSec = metadata.format.duration ?? 0;
        sampleRate = metadata.format.sampleRate ?? 44100;
        channels = metadata.format.numberOfChannels ?? 2;
      } catch (err) {
        fastify.log.warn({ err }, 'music-metadata failed to parse audio headers; using defaults');
        // Non-fatal: store the file with defaults rather than rejecting a valid upload.
      }

      // Build the R2 key.
      const ext = MIME_TO_EXT[mimeType] ?? 'bin';
      const s3StreamKey = `audio/${sessionId}/${randomUUID()}.${ext}`;

      // Upload to R2.
      try {
        await r2.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: s3StreamKey,
            Body: fileData,
            ContentType: mimeType,
            ContentLength: fileData.byteLength,
          })
        );
      } catch (err) {
        fastify.log.error({ err }, 'R2 upload failed');
        return reply
          .code(500)
          .send({ error: 'internal_error', message: 'File upload failed' });
      }

      // Persist the AudioFile row.
      let audioFile;
      try {
        audioFile = await fastify.storage.createAudioFile({
          sessionId,
          uploaderId: claims.sub,
          s3StreamKey,
          s3FullKey: null,
          mimeType,
          durationSec,
          sampleRate,
          channels,
          fileSizeBytes: BigInt(fileData.byteLength),
        });
      } catch (err) {
        fastify.log.error({ err }, 'AudioFile DB write failed');
        return reply
          .code(500)
          .send({ error: 'internal_error', message: 'Failed to save audio file record' });
      }

      // fileSizeBytes is BigInt — serialize as string for JSON.
      return reply.code(200).send({
        ...audioFile,
        fileSizeBytes: audioFile.fileSizeBytes.toString(),
      });
    }
  );

  // -------------------------------------------------------------------------
  // GET /api/v1/audio/:audioFileId/stream-url
  //
  // Returns a presigned R2 GetObject URL (TTL: 1 hour) for the stream copy.
  // Any session member may stream; non-members get 403.
  // -------------------------------------------------------------------------

  fastify.get(
    '/api/v1/audio/:audioFileId/stream-url',
    async (
      request: FastifyRequest<{ Params: { audioFileId: string } }>,
      reply: FastifyReply
    ) => {
      const claims = await extractClaims(request);
      if (!claims) {
        return reply
          .code(401)
          .send({ error: 'unauthorized', message: 'Missing or invalid Bearer token' });
      }

      const { audioFileId } = request.params;

      // Load the AudioFile record.
      const audioFile = await fastify.storage.getAudioFile(audioFileId);
      if (!audioFile) {
        return reply
          .code(404)
          .send({ error: 'not_found', message: 'Audio file not found' });
      }

      // Verify the requesting user is a member of the audio file's session.
      const member = await fastify.storage.getSessionMember(
        claims.sub,
        audioFile.sessionId
      );
      if (!member) {
        return reply
          .code(403)
          .send({ error: 'forbidden', message: 'You are not a member of this session' });
      }

      // Generate a presigned GetObject URL for the stream key.
      let url: string;
      try {
        url = await getSignedUrl(
          r2,
          new GetObjectCommand({
            Bucket: R2_BUCKET,
            Key: audioFile.s3StreamKey,
          }),
          { expiresIn: STREAM_URL_TTL_SECONDS }
        );
      } catch (err) {
        fastify.log.error({ err }, 'Failed to generate presigned URL');
        return reply
          .code(500)
          .send({ error: 'internal_error', message: 'Failed to generate streaming URL' });
      }

      const expiresAt = new Date(
        Date.now() + STREAM_URL_TTL_SECONDS * 1000
      ).toISOString();

      return reply.code(200).send({ url, expiresAt });
    }
  );
}
