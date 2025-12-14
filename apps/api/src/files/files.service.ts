/**
 * Files Service
 * Handles business logic for file operations
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { type TenantContext } from '@forgestack/db';
import { FilesRepository } from './files.repository';
import { StorageService } from './storage.service';
import { ActivitiesService } from '../activities/activities.service';
import {
  PresignedUrlRequestDto,
  PresignedUrlResponseDto,
  CompleteUploadResponseDto,
  FileDto,
  PaginatedFilesDto,
  ListFilesQueryDto,
} from './dto';

// File validation configuration
const FILE_VALIDATION: Record<string, { maxSize: number; allowedTypes: string[] }> = {
  avatar: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
  logo: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  },
  attachment: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [], // Allow all types for attachments
  },
};

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly filesRepository: FilesRepository,
    private readonly storageService: StorageService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  /**
   * Generate a presigned URL for file upload
   */
  async getPresignedUploadUrl(
    ctx: TenantContext,
    dto: PresignedUrlRequestDto,
  ): Promise<PresignedUrlResponseDto> {
    this.logger.log(`Generating presigned URL for ${dto.purpose}: ${dto.filename}`);

    // Validate file type and size
    this.validateFile(dto.purpose, dto.contentType, dto.size);

    // Validate attachment requirements
    if (dto.purpose === 'attachment' && (!dto.entityType || !dto.entityId)) {
      throw new BadRequestException('entityType and entityId are required for attachments');
    }

    // Generate unique S3 key
    const key = this.storageService.generateKey(ctx.orgId, dto.purpose, dto.filename);

    // Create file record
    const file = await this.filesRepository.create(ctx, {
      bucket: this.storageService.getBucket(),
      key,
      filename: dto.filename,
      contentType: dto.contentType,
      size: dto.size,
      purpose: dto.purpose,
      entityType: dto.entityType,
      entityId: dto.entityId,
      uploadedAt: null,
    });

    // Generate presigned upload URL (15 minutes expiry)
    const uploadUrl = await this.storageService.getPresignedUploadUrl(key, dto.contentType, 900);
    const expiresAt = new Date(Date.now() + 900 * 1000).toISOString();

    this.logger.log(`Presigned URL generated for file ${file.id}`);

    return {
      fileId: file.id,
      uploadUrl,
      expiresAt,
    };
  }

  /**
   * Mark a file upload as complete
   */
  async completeUpload(
    ctx: TenantContext,
    fileId: string,
  ): Promise<CompleteUploadResponseDto> {
    this.logger.log(`Completing upload for file ${fileId}`);

    // Mark file as uploaded
    const file = await this.filesRepository.markUploaded(ctx, fileId);
    if (!file) {
      throw new NotFoundException('File not found or already uploaded');
    }

    // If this is an avatar or logo, soft-delete the previous one
    if (file.purpose === 'avatar' || file.purpose === 'logo') {
      const previousFile = await this.filesRepository.findPreviousFile(
        ctx,
        file.purpose,
        file.entityType || undefined,
        file.entityId || undefined,
      );

      if (previousFile && previousFile.id !== file.id) {
        await this.filesRepository.softDelete(ctx, previousFile.id);
        this.logger.debug(`Soft-deleted previous ${file.purpose} file: ${previousFile.id}`);
      }
    }

    // Generate download URL
    const url = await this.storageService.getPresignedDownloadUrl(file.key);

    // Create activity (async, non-blocking) - only for attachments
    if (file.purpose === 'attachment') {
      await this.activitiesService.create({
        orgId: ctx.orgId,
        actorId: ctx.userId,
        type: 'file.uploaded',
        title: `uploaded file "${file.filename}"`,
        resourceType: 'file',
        resourceId: file.id,
        resourceName: file.filename,
      });
    }

    this.logger.log(`Upload completed for file ${fileId}`);

    return {
      id: file.id,
      url,
    };
  }

  /**
   * Get file metadata and download URL
   */
  async getFile(ctx: TenantContext, fileId: string): Promise<FileDto> {
    this.logger.debug(`Getting file ${fileId}`);

    const file = await this.filesRepository.findById(ctx, fileId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Generate download URL
    const url = await this.storageService.getPresignedDownloadUrl(file.key);

    return {
      id: file.id,
      filename: file.filename,
      contentType: file.contentType,
      size: file.size,
      purpose: file.purpose,
      entityType: file.entityType || undefined,
      entityId: file.entityId || undefined,
      url,
      createdAt: file.createdAt.toISOString(),
    };
  }

  /**
   * Soft delete a file
   */
  async deleteFile(ctx: TenantContext, fileId: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Deleting file ${fileId}`);

    const file = await this.filesRepository.findById(ctx, fileId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    const deletedFile = await this.filesRepository.softDelete(ctx, fileId);
    if (!deletedFile) {
      throw new NotFoundException('File not found or already deleted');
    }

    // Create activity (async, non-blocking) - only for attachments
    if (file.purpose === 'attachment') {
      await this.activitiesService.create({
        orgId: ctx.orgId,
        actorId: ctx.userId,
        type: 'file.deleted',
        title: `deleted file "${file.filename}"`,
        resourceType: 'file',
        resourceId: file.id,
        resourceName: file.filename,
      });
    }

    this.logger.log(`File ${fileId} soft-deleted`);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  }

  /**
   * List files with pagination and filters
   */
  async listFiles(ctx: TenantContext, query: ListFilesQueryDto): Promise<PaginatedFilesDto> {
    this.logger.debug(`Listing files for org ${ctx.orgId}`);

    const result = await this.filesRepository.findAll(ctx, {
      purpose: query.purpose,
      entityType: query.entityType,
      entityId: query.entityId,
      page: query.page,
      limit: query.limit,
    });

    // Generate download URLs for all files
    const data = await Promise.all(
      result.items.map(async (file) => {
        const url = await this.storageService.getPresignedDownloadUrl(file.key);
        return {
          id: file.id,
          filename: file.filename,
          contentType: file.contentType,
          size: file.size,
          purpose: file.purpose,
          entityType: file.entityType || undefined,
          entityId: file.entityId || undefined,
          url,
          createdAt: file.createdAt.toISOString(),
        };
      }),
    );

    return {
      data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  /**
   * Validate file type and size based on purpose
   */
  private validateFile(purpose: string, contentType: string, size: number): void {
    const validation = FILE_VALIDATION[purpose];
    if (!validation) {
      throw new BadRequestException(`Invalid file purpose: ${purpose}`);
    }

    // Validate content type format (basic sanitization)
    // This prevents malformed content types but does NOT prevent spoofing
    if (!contentType || !/^[a-z]+\/[a-z0-9.+-]+$/i.test(contentType)) {
      throw new BadRequestException('Invalid content type format');
    }

    // TODO: In a production system, validate actual file content after upload
    // by reading magic bytes. Client-provided content-type can be spoofed.
    // A malicious user could upload an executable with 'image/png' content type.

    // Check file size
    if (size > validation.maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${validation.maxSize / (1024 * 1024)}MB`,
      );
    }

    // Check content type (skip for attachments which allow all types)
    if (validation.allowedTypes.length > 0 && !validation.allowedTypes.includes(contentType)) {
      throw new BadRequestException(
        `Content type ${contentType} is not allowed for ${purpose}. Allowed types: ${validation.allowedTypes.join(', ')}`,
      );
    }
  }
}
