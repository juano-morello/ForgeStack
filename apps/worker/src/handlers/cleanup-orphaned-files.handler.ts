/**
 * Cleanup Orphaned Files Handler
 * Removes file records and R2 objects for uploads that were never completed
 */

import { Job } from 'bullmq';
import { files, withServiceContext, eq, and, isNull, lt } from '@forgestack/db';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

export interface CleanupOrphanedFilesJobData {
  olderThanHours?: number; // Default: 24
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

export async function handleCleanupOrphanedFiles(job: Job<CleanupOrphanedFilesJobData>) {
  const olderThanHours = job.data.olderThanHours ?? 24;
  const batchSize = job.data.batchSize ?? 100;

  console.log(`[CleanupOrphanedFiles] Processing job ${job.id} (older than ${olderThanHours}h)`);

  const olderThan = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

  // Find orphaned files (completed_at IS NULL, created_at < threshold)
  const orphanedFiles = await withServiceContext('cleanup-orphaned-files', async (db) => {
    return db
      .select()
      .from(files)
      .where(and(isNull(files.uploadedAt), lt(files.createdAt, olderThan)))
      .limit(batchSize);
  });

  console.log(`[CleanupOrphanedFiles] Found ${orphanedFiles.length} orphaned files`);

  let deletedCount = 0;
  let failedCount = 0;

  for (const file of orphanedFiles) {
    try {
      // Delete from R2
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: file.key,
        }),
      );

      // Delete record from database
      await withServiceContext('cleanup-orphaned-files', async (db) => {
        await db.delete(files).where(eq(files.id, file.id));
      });

      deletedCount++;
      console.log(`[CleanupOrphanedFiles] Deleted orphaned file: ${file.id} (${file.key})`);
    } catch (error) {
      failedCount++;
      console.error(`[CleanupOrphanedFiles] Failed to delete file ${file.id}:`, error);
    }
  }

  console.log(
    `[CleanupOrphanedFiles] Completed: ${deletedCount} deleted, ${failedCount} failed`,
  );

  return {
    deletedCount,
    failedCount,
    totalProcessed: orphanedFiles.length,
  };
}

