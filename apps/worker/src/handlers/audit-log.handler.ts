/**
 * Audit Log Handler
 * Processes audit log events from the queue and stores them in the database
 */

import { Job } from 'bullmq';
import { auditLogs, withServiceContext } from '@forgestack/db';
import { createLogger } from '../telemetry/logger';

const logger = createLogger('AuditLog');

export interface AuditLogJobData {
  orgId: string;
  actorId?: string;
  actorType: 'user' | 'api_key' | 'system';
  actorName?: string;
  actorEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function handleAuditLog(job: Job<AuditLogJobData>) {
  const data = job.data;

  logger.info(
    { jobId: job.id, action: data.action, resourceType: data.resourceType, orgId: data.orgId },
    'Processing audit log job'
  );

  try {
    // Use service context to bypass RLS for worker processing
    await withServiceContext('AuditLogHandler.handleAuditLog', async (tx) => {
      await tx.insert(auditLogs).values({
        orgId: data.orgId,
        actorId: data.actorId || null,
        actorType: data.actorType,
        actorName: data.actorName || null,
        actorEmail: data.actorEmail || null,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId || null,
        resourceName: data.resourceName || null,
        changes: data.changes || null,
        metadata: data.metadata || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      });
    });

    logger.info({ action: data.action, resourceType: data.resourceType }, 'Audit log processed successfully');
    return { success: true };
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        action: data.action,
        resourceType: data.resourceType,
      },
      'Failed to process audit log'
    );
    // Rethrow to trigger retry
    throw error;
  }
}

