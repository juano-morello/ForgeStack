/**
 * File Upload Types
 *
 * Type definitions for file upload functionality.
 */

export type FilePurpose = 'avatar' | 'logo' | 'attachment';

export interface FileRecord {
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
  key?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadState {
  status: 'idle' | 'preparing' | 'uploading' | 'completing' | 'success' | 'error';
  progress: UploadProgress | null;
  error: string | null;
  file: FileRecord | null;
}

