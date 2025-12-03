/**
 * Cleanup Deleted Files Handler
 * Permanently removes soft-deleted files after retention period
 */

import { Job } from 'bullmq';
import { files, withServiceContext, eq, and, isNotNull, lt } from '@forgestack/db';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createLogger } from '../telemetry/logger';

const logger = createLogger('CleanupDeletedFiles');

export interface CleanupDeletedFilesJobData {
  olderThanDays?: number; // Default: 30
  batchSize?: number; // Default: 100
}

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const bucket = process.env.R2_BUCKET_NAME || 'forgestack-uploads';

export async function handleCleanupDeletedFiles(job: Job<CleanupDeletedFilesJobData>) {
  const olderThanDays = job.data.olderThanDays ?? 30;
  const batchSize = job.data.batchSize ?? 100;

  logger.info({ jobId: job.id, olderThanDays, batchSize }, 'Processing cleanup deleted files job');

  const olderThan = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

  // Find soft-deleted files past retention
  const deletedFiles = await withServiceContext('cleanup-deleted-files', async (db) => {
    return db
      .select()
      .from(files)
      .where(
        and(
          isNotNull(files.deletedAt),
          lt(files.deletedAt, olderThan),
          isNotNull(files.uploadedAt), // Only completed files count toward quota
        ),
      )
      .limit(batchSize);
  });

  logger.info({ count: deletedFiles.length }, 'Found deleted files to clean up');

  // Group by org for storage update
  const storageByOrg = new Map<string, number>();
  let deletedCount = 0;
  let failedCount = 0;

  for (const file of deletedFiles) {
    try {
      // Delete from R2
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: file.key,
        }),
      );

      // Track storage to reclaim
      const current = storageByOrg.get(file.orgId) ?? 0;
      storageByOrg.set(file.orgId, current + file.size);

      // Delete record permanently
      await withServiceContext('cleanup-deleted-files', async (db) => {
        await db.delete(files).where(eq(files.id, file.id));
      });

      deletedCount++;
      logger.debug({ fileId: file.id, key: file.key }, 'Permanently deleted file');
    } catch (error) {
      failedCount++;
      logger.error({ fileId: file.id, error }, 'Failed to delete file');
    }
  }

  // Log storage reclaimed per org (storage tracking to be implemented in future)
  for (const [orgId, reclaimedBytes] of storageByOrg) {
    logger.debug({ orgId, reclaimedBytes }, 'Reclaimed storage for org');
  }

  logger.info(
    {
      deletedCount,
      failedCount,
      orgsUpdated: storageByOrg.size,
    },
    'Cleanup deleted files completed'
  );

  return {
    deletedCount,
    failedCount,
    totalProcessed: deletedFiles.length,
    orgsUpdated: storageByOrg.size,
  };
}

