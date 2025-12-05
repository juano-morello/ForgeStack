/**
 * File Types
 * Types for file upload functionality
 */

export type FilePurpose = 'avatar' | 'logo' | 'attachment';

export const FILE_LIMITS = {
  MAX_SIZE_BYTES: 52428800, // 50MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain'],
} as const;

export interface BaseFile {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  purpose: FilePurpose;
  url: string;
  createdAt: string;
  entityType?: string;
  entityId?: string;
}

export interface PresignedUrlRequest {
  filename: string;
  contentType: string;
  size: number;
  purpose: FilePurpose;
  entityType?: string;
  entityId?: string;
}

export interface PresignedUrlResponse {
  fileId: string;
  uploadUrl: string;
  expiresAt: string;
}

