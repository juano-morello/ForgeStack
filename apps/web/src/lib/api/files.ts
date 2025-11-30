/**
 * Files API Client
 *
 * API functions for file upload and management.
 */

import { api } from '@/lib/api';
import type {
  FileRecord,
  FilePurpose,
  PresignedUrlRequest,
  PresignedUrlResponse,
} from '@/types/files';

/**
 * Request a presigned URL for uploading a file
 */
export async function getPresignedUploadUrl(
  orgId: string,
  request: PresignedUrlRequest
): Promise<PresignedUrlResponse> {
  try {
    const response = await api.post<PresignedUrlResponse>(
      '/files/presigned-url',
      request
    );
    return response;
  } catch (error) {
    console.error('Failed to get presigned upload URL:', error);
    throw error;
  }
}

/**
 * Mark an upload as complete after successful upload to R2
 */
export async function completeUpload(
  orgId: string,
  fileId: string
): Promise<FileRecord> {
  try {
    const response = await api.post<FileRecord>(
      `/files/${fileId}/complete`
    );
    return response;
  } catch (error) {
    console.error('Failed to complete upload:', error);
    throw error;
  }
}

/**
 * Get file metadata and download URL
 */
export async function getFile(
  orgId: string,
  fileId: string
): Promise<FileRecord> {
  try {
    const response = await api.get<FileRecord>(`/files/${fileId}`);
    return response;
  } catch (error) {
    console.error('Failed to get file:', error);
    throw error;
  }
}

/**
 * Delete a file (soft delete)
 */
export async function deleteFile(
  orgId: string,
  fileId: string
): Promise<void> {
  try {
    await api.delete(`/files/${fileId}`);
  } catch (error) {
    console.error('Failed to delete file:', error);
    throw error;
  }
}

/**
 * List files with optional filters
 */
export async function listFiles(
  orgId: string,
  purpose?: FilePurpose,
  entityType?: string,
  entityId?: string
): Promise<FileRecord[]> {
  try {
    const params = new URLSearchParams();
    if (purpose) params.append('purpose', purpose);
    if (entityType) params.append('entityType', entityType);
    if (entityId) params.append('entityId', entityId);

    const queryString = params.toString();
    const endpoint = queryString ? `/files?${queryString}` : '/files';

    const response = await api.get<{ data: FileRecord[] }>(endpoint);
    return response.data;
  } catch (error) {
    console.error('Failed to list files:', error);
    throw error;
  }
}

