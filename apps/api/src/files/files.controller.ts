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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
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

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  private readonly logger = new Logger(FilesController.name);

  constructor(private readonly filesService: FilesService) {}

  /**
   * Request a presigned URL for file upload
   * POST /files/presigned-url
   */
  @Post('presigned-url')
  @ApiOperation({
    summary: 'Request presigned upload URL',
    description: 'Generate a presigned URL for uploading a file to S3'
  })
  @ApiResponse({ status: 201, description: 'Presigned URL generated successfully', type: PresignedUrlResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({
    summary: 'Complete file upload',
    description: 'Mark a file upload as complete after uploading to S3'
  })
  @ApiParam({ name: 'id', description: 'File ID', type: String })
  @ApiResponse({ status: 200, description: 'Upload completed successfully', type: CompleteUploadResponseDto })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({
    summary: 'Get file details',
    description: 'Retrieve file metadata and a presigned download URL'
  })
  @ApiParam({ name: 'id', description: 'File ID', type: String })
  @ApiResponse({ status: 200, description: 'File details retrieved successfully', type: FileDto })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({
    summary: 'Delete file',
    description: 'Soft delete a file (marks as deleted but does not remove from storage)'
  })
  @ApiParam({ name: 'id', description: 'File ID', type: String })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({
    summary: 'List files',
    description: 'Get a paginated list of files with optional filters'
  })
  @ApiQuery({ name: 'purpose', required: false, enum: ['avatar', 'logo', 'attachment'], description: 'Filter by file purpose' })
  @ApiQuery({ name: 'entityType', required: false, type: String, description: 'Filter by entity type' })
  @ApiQuery({ name: 'entityId', required: false, type: String, description: 'Filter by entity ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully', type: PaginatedFilesDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listFiles(
    @Query() query: ListFilesQueryDto,
    @CurrentTenant() ctx: TenantContext,
  ): Promise<PaginatedFilesDto> {
    this.logger.log(`Listing files for org ${ctx.orgId}`);
    return this.filesService.listFiles(ctx, query);
  }
}

