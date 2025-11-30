/**
 * Storage Service
 * Abstraction layer for R2/S3 file storage operations
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    
    this.bucket = this.configService.get<string>('R2_BUCKET_NAME') || 'forgestack-uploads';
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL') || '';

    if (!accountId || !accessKeyId || !secretAccessKey) {
      this.logger.warn('R2 credentials not configured. File uploads will not work.');
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    });

    this.logger.log(`Storage service initialized with bucket: ${this.bucket}`);
  }

  /**
   * Generate a presigned URL for uploading a file
   * @param key - S3 key for the file
   * @param contentType - MIME type of the file
   * @param expiresIn - URL expiration time in seconds (default: 15 minutes)
   */
  async getPresignedUploadUrl(key: string, contentType: string, expiresIn = 900): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    
    const url = await getSignedUrl(this.s3Client, command, { expiresIn });
    this.logger.debug(`Generated upload URL for key: ${key}`);
    return url;
  }

  /**
   * Generate a presigned URL for downloading a file
   * @param key - S3 key for the file
   * @param expiresIn - URL expiration time in seconds (default: 1 hour)
   */
  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    
    const url = await getSignedUrl(this.s3Client, command, { expiresIn });
    this.logger.debug(`Generated download URL for key: ${key}`);
    return url;
  }

  /**
   * Delete a file from storage
   * @param key - S3 key for the file
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    
    await this.s3Client.send(command);
    this.logger.debug(`Deleted file with key: ${key}`);
  }

  /**
   * Generate a unique S3 key for a file
   * @param orgId - Organization ID
   * @param purpose - File purpose (avatar, logo, attachment)
   * @param filename - Original filename
   */
  generateKey(orgId: string, purpose: string, filename: string): string {
    const timestamp = Date.now();
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${orgId}/${purpose}/${timestamp}-${sanitized}`;
  }

  /**
   * Get the configured bucket name
   */
  getBucket(): string {
    return this.bucket;
  }
}

