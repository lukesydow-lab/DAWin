/**
 * server/r2.ts
 *
 * Cloudflare R2 S3Client singleton.
 *
 * R2 is S3-compatible — the AWS SDK works unchanged; only the endpoint and
 * credentials differ from AWS S3.
 *
 * Required env vars (see .env.example):
 *   R2_ACCOUNT_ID       — Cloudflare account ID
 *   R2_ACCESS_KEY_ID    — R2 API token access key
 *   R2_SECRET_ACCESS_KEY— R2 API token secret
 *   R2_BUCKET_NAME      — e.g. "dawin-audio-dev"
 */

import { S3Client } from '@aws-sdk/client-s3';

if (!process.env['R2_ACCOUNT_ID']) {
  console.warn('[r2] WARNING: R2_ACCOUNT_ID is not set. Audio upload/stream routes will fail.');
}

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env['R2_ACCESS_KEY_ID'] ?? '',
    secretAccessKey: process.env['R2_SECRET_ACCESS_KEY'] ?? '',
  },
});

/** The R2 bucket name to use for all uploads and presigned URL generation. */
export const R2_BUCKET = process.env['R2_BUCKET_NAME'] ?? '';
