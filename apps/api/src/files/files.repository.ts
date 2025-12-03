/**
 * Files Repository
 * Handles all database operations for file metadata
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  eq,
  and,
  desc,
  count,
  sql,
  isNull,
  isNotNull,
  lt,
  withTenantContext,
  withServiceContext,
  files,
  type TenantContext,
  type File,
  type NewFile,
} from '@forgestack/db';

export interface PaginatedFiles {
  items: File[];
  total: number;
  page: number;
  limit: number;
}

export interface FindAllOptions {
  purpose?: string;
  entityType?: string;
  entityId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class FilesRepository {
  private readonly logger = new Logger(FilesRepository.name);

  /**
   * Create a new file record within tenant context
   */
  async create(ctx: TenantContext, data: Omit<NewFile, 'orgId' | 'userId'>): Promise<File> {
    this.logger.debug(`Creating file record for "${data.filename}" in org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const [file] = await tx
        .insert(files)
        .values({
          ...data,
          orgId: ctx.orgId,
          userId: ctx.userId,
        })
        .returning();

      return file;
    });
  }

  /**
   * Find a file by ID within tenant context
   */
  async findById(ctx: TenantContext, id: string): Promise<File | null> {
    this.logger.debug(`Finding file ${id} in org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const [file] = await tx
        .select()
        .from(files)
        .where(and(eq(files.id, id), isNull(files.deletedAt)));

      return file || null;
    });
  }

  /**
   * Find files by entity within tenant context
   */
  async findByEntity(
    ctx: TenantContext,
    entityType: string,
    entityId: string,
  ): Promise<File[]> {
    this.logger.debug(`Finding files for ${entityType}:${entityId} in org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      return tx
        .select()
        .from(files)
        .where(
          and(
            eq(files.entityType, entityType),
            eq(files.entityId, entityId),
            isNull(files.deletedAt),
            isNotNull(files.uploadedAt),
          ),
        )
        .orderBy(desc(files.createdAt));
    });
  }

  /**
   * List files with pagination and filters within tenant context
   */
  async findAll(ctx: TenantContext, options: FindAllOptions = {}): Promise<PaginatedFiles> {
    const { purpose, entityType, entityId, page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    this.logger.debug(`Listing files in org ${ctx.orgId} (page: ${page}, limit: ${limit})`);

    return withTenantContext(ctx, async (tx) => {
      // Build filter conditions
      const conditions = [isNull(files.deletedAt), isNotNull(files.uploadedAt)];

      if (purpose) {
        conditions.push(eq(files.purpose, purpose));
      }
      if (entityType) {
        conditions.push(eq(files.entityType, entityType));
      }
      if (entityId) {
        conditions.push(eq(files.entityId, entityId));
      }

      const whereClause = and(...conditions);

      // Get total count
      const [{ value: total }] = await tx
        .select({ value: count() })
        .from(files)
        .where(whereClause);

      // Get paginated items
      const items = await tx
        .select()
        .from(files)
        .where(whereClause)
        .orderBy(desc(files.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        items,
        total,
        page,
        limit,
      };
    });
  }

  /**
   * Mark a file upload as complete
   */
  async markUploaded(ctx: TenantContext, id: string): Promise<File | null> {
    this.logger.debug(`Marking file ${id} as uploaded`);

    return withTenantContext(ctx, async (tx) => {
      const [file] = await tx
        .update(files)
        .set({ uploadedAt: new Date() })
        .where(and(eq(files.id, id), isNull(files.uploadedAt)))
        .returning();

      return file || null;
    });
  }

  /**
   * Soft delete a file
   */
  async softDelete(ctx: TenantContext, id: string): Promise<File | null> {
    this.logger.debug(`Soft deleting file ${id}`);

    return withTenantContext(ctx, async (tx) => {
      const [file] = await tx
        .update(files)
        .set({ deletedAt: new Date() })
        .where(and(eq(files.id, id), isNull(files.deletedAt)))
        .returning();

      return file || null;
    });
  }

  /**
   * Find orphaned files (created but not uploaded within time threshold)
   * Uses service context to bypass RLS
   */
  async findOrphanedFiles(olderThanDate: Date, limit = 100): Promise<File[]> {
    this.logger.debug(`Finding orphaned files older than ${olderThanDate.toISOString()}`);

    return withServiceContext('cleanup-orphaned-files', async (tx) => {
      return tx
        .select()
        .from(files)
        .where(and(isNull(files.uploadedAt), lt(files.createdAt, olderThanDate)))
        .limit(limit);
    });
  }

  /**
   * Find deleted files past retention period
   * Uses service context to bypass RLS
   */
  async findDeletedFiles(olderThanDate: Date, limit = 100): Promise<File[]> {
    this.logger.debug(`Finding deleted files older than ${olderThanDate.toISOString()}`);

    return withServiceContext('cleanup-deleted-files', async (tx) => {
      return tx
        .select()
        .from(files)
        .where(
          and(
            isNotNull(files.deletedAt),
            lt(files.deletedAt, olderThanDate),
            isNotNull(files.uploadedAt),
          ),
        )
        .limit(limit);
    });
  }

  /**
   * Permanently delete a file record
   * Uses service context to bypass RLS
   */
  async permanentlyDelete(id: string): Promise<void> {
    this.logger.debug(`Permanently deleting file ${id}`);

    await withServiceContext('permanent-file-deletion', async (tx) => {
      await tx.delete(files).where(eq(files.id, id));
    });
  }

  /**
   * Find previous file for replacement (avatar/logo)
   */
  async findPreviousFile(
    ctx: TenantContext,
    purpose: string,
    entityType?: string,
    entityId?: string,
  ): Promise<File | null> {
    this.logger.debug(`Finding previous ${purpose} file`);

    return withTenantContext(ctx, async (tx) => {
      const conditions = [
        eq(files.purpose, purpose),
        isNull(files.deletedAt),
        isNotNull(files.uploadedAt),
      ];

      if (entityType) {
        conditions.push(eq(files.entityType, entityType));
      }
      if (entityId) {
        conditions.push(eq(files.entityId, entityId));
      }

      const [file] = await tx
        .select()
        .from(files)
        .where(and(...conditions))
        .orderBy(desc(files.uploadedAt))
        .limit(1);

      return file || null;
    });
  }

  /**
   * Get total storage used by an organization (in bytes)
   * Uses service context to bypass RLS for org-wide calculation
   */
  async getStorageUsed(orgId: string): Promise<number> {
    this.logger.debug(`Calculating storage used for org ${orgId}`);

    return withServiceContext('FilesRepository.getStorageUsed', async (tx) => {
      const result = await tx
        .select({
          total: sql<number>`COALESCE(SUM(${files.size}), 0)`,
        })
        .from(files)
        .where(
          and(
            eq(files.orgId, orgId),
            isNull(files.deletedAt),
            isNotNull(files.uploadedAt),
          ),
        );

      return Number(result[0]?.total ?? 0);
    });
  }
}
