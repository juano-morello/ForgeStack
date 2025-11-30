/**
 * File Upload Hook
 *
 * Manages file upload state and handles the upload flow:
 * 1. Get presigned URL from API
 * 2. Upload directly to R2 using presigned URL
 * 3. Track progress with XMLHttpRequest
 * 4. Complete upload on API
 */

import { useState, useCallback } from 'react';
import type { FilePurpose, UploadState, FileRecord } from '@/types/files';
import { getPresignedUploadUrl, completeUpload } from '@/lib/api/files';
import { validateFile } from '@/lib/file-constants';

export function useFileUpload(orgId: string) {
  const [state, setState] = useState<UploadState>({
    status: 'idle',
    progress: null,
    error: null,
    file: null,
  });

  const upload = useCallback(
    async (
      file: File,
      purpose: FilePurpose,
      entityType?: string,
      entityId?: string
    ): Promise<FileRecord | null> => {
      // Validate file
      const validation = validateFile(file, purpose);
      if (!validation.valid) {
        setState({
          status: 'error',
          progress: null,
          error: validation.error || 'Invalid file',
          file: null,
        });
        return null;
      }

      try {
        // Step 1: Get presigned URL
        setState({
          status: 'preparing',
          progress: null,
          error: null,
          file: null,
        });

        const presignedData = await getPresignedUploadUrl(orgId, {
          filename: file.name,
          contentType: file.type,
          size: file.size,
          purpose,
          entityType,
          entityId,
        });

        // Step 2: Upload to R2 using XMLHttpRequest for progress tracking
        setState((prev) => ({
          ...prev,
          status: 'uploading',
          progress: { loaded: 0, total: file.size, percentage: 0 },
        }));

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percentage = Math.round((e.loaded / e.total) * 100);
              setState((prev) => ({
                ...prev,
                progress: {
                  loaded: e.loaded,
                  total: e.total,
                  percentage,
                },
              }));
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Upload failed'));
          });

          xhr.addEventListener('abort', () => {
            reject(new Error('Upload aborted'));
          });

          xhr.open('PUT', presignedData.uploadUrl);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(file);
        });

        // Step 3: Complete upload on API
        setState((prev) => ({
          ...prev,
          status: 'completing',
        }));

        const fileRecord = await completeUpload(orgId, presignedData.fileId);

        setState({
          status: 'success',
          progress: { loaded: file.size, total: file.size, percentage: 100 },
          error: null,
          file: fileRecord,
        });

        return fileRecord;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Upload failed';
        setState({
          status: 'error',
          progress: null,
          error: errorMessage,
          file: null,
        });
        return null;
      }
    },
    [orgId]
  );

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      progress: null,
      error: null,
      file: null,
    });
  }, []);

  return {
    ...state,
    upload,
    reset,
  };
}

