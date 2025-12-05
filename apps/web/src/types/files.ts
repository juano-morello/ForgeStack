/**
 * File Upload Types
 *
 * Extended type definitions for file upload functionality.
 * Base types imported from @forgestack/shared
 */

// Re-export base types from shared
export type { FilePurpose, BaseFile, PresignedUrlRequest, PresignedUrlResponse } from '@forgestack/shared/browser';
export { FILE_LIMITS } from '@forgestack/shared/browser';

// Aliases for backward compatibility
import type { BaseFile } from '@forgestack/shared/browser';
export type FileRecord = BaseFile;

// Web-specific types
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

