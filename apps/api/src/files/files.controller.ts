/**
 * Files Controller
 * REST API endpoints for file upload and management
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  Logger,
} from '@nestjs/common';
import type { TenantContext } from '@forgestack/db';
import { FilesService } from './files.service';
import {
  PresignedUrlRequestDto,
  PresignedUrlResponseDto,
  CompleteUploadResponseDto,
  FileDto,
  PaginatedFilesDto,
  ListFilesQueryDto,
} from './dto';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';

@Controller('files')
export class FilesController {
  private readonly logger = new Logger(FilesController.name);

  constructor(private readonly filesService: FilesService) {}

  /**
   * Request a presigned URL for file upload
   * POST /files/presigned-url
   */
  @Post('presigned-url')
  async getPresignedUrl(
    @Body() dto: PresignedUrlRequestDto,
    @CurrentTenant() ctx: TenantContext,
  ): Promise<PresignedUrlResponseDto> {
    this.logger.log(`Requesting presigned URL for ${dto.purpose}: ${dto.filename}`);
    return this.filesService.getPresignedUploadUrl(ctx, dto);
  }

  /**
   * Mark a file upload as complete
   * POST /files/:id/complete
   */
  @Post(':id/complete')
  async completeUpload(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() ctx: TenantContext,
  ): Promise<CompleteUploadResponseDto> {
    this.logger.log(`Completing upload for file ${id}`);
    return this.filesService.completeUpload(ctx, id);
  }

  /**
   * Get file metadata and download URL
   * GET /files/:id
   */
  @Get(':id')
  async getFile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() ctx: TenantContext,
  ): Promise<FileDto> {
    return this.filesService.getFile(ctx, id);
  }

  /**
   * Soft delete a file
   * DELETE /files/:id
   */
  @Delete(':id')
  async deleteFile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() ctx: TenantContext,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Deleting file ${id}`);
    return this.filesService.deleteFile(ctx, id);
  }

  /**
   * List files with optional filters
   * GET /files
   */
  @Get()
  async listFiles(
    @Query() query: ListFilesQueryDto,
    @CurrentTenant() ctx: TenantContext,
  ): Promise<PaginatedFilesDto> {
    this.logger.log(`Listing files for org ${ctx.orgId}`);
    return this.filesService.listFiles(ctx, query);
  }
}

