-- Fix SPRINT-7-001: AudioFile.peaks had no DEFAULT, leaving pre-existing rows NULL.
-- Step 1: backfill any rows where peaks is currently NULL to an empty array.
UPDATE "AudioFile" SET "peaks" = '{}' WHERE "peaks" IS NULL;

-- Step 2: set a DEFAULT so future rows written without an explicit peaks value
-- receive an empty array rather than NULL.
ALTER TABLE "AudioFile" ALTER COLUMN "peaks" SET DEFAULT '{}';
