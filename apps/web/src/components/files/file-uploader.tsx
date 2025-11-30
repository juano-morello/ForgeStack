'use client';

/**
 * File Uploader Component
 *
 * Drag-and-drop file uploader with progress tracking.
 * Supports file type and size validation.
 */

import { useRef, useState } from 'react';
import { Upload, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFileUpload } from '@/hooks/use-file-upload';
import { FILE_CONFIG, formatFileSize } from '@/lib/file-constants';
import type { FilePurpose, FileRecord } from '@/types/files';

export interface FileUploaderProps {
  orgId: string;
  purpose: FilePurpose;
  maxSize?: number;
  accept?: string;
  onUpload?: (file: FileRecord) => void;
  onError?: (error: string) => void;
  entityType?: string;
  entityId?: string;
  className?: string;
}

export function FileUploader({
  orgId,
  purpose,
  maxSize,
  accept,
  onUpload,
  onError,
  entityType,
  entityId,
  className,
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { status, progress, error, file, upload, reset } = useFileUpload(orgId);

  const config = FILE_CONFIG[purpose];
  const finalMaxSize = maxSize || config.maxSize;
  const finalAccept = accept || config.accept;

  const handleFile = async (selectedFile: File) => {
    const result = await upload(selectedFile, purpose, entityType, entityId);
    if (result) {
      onUpload?.(result);
    } else if (error) {
      onError?.(error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isUploading = status === 'preparing' || status === 'uploading' || status === 'completing';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragging && 'border-primary bg-primary/5',
          !isDragging && 'border-muted-foreground/25 hover:border-primary/50',
          isUploading && 'pointer-events-none opacity-50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={finalAccept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {status === 'idle' && (
          <div className="space-y-2">
            <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Drop file here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {config.acceptLabel} • Max {formatFileSize(finalMaxSize)}
              </p>
            </div>
          </div>
        )}

        {isUploading && (
          <div className="space-y-3">
            <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
            <div>
              <p className="text-sm font-medium">
                {status === 'preparing' && 'Preparing upload...'}
                {status === 'uploading' && 'Uploading...'}
                {status === 'completing' && 'Completing...'}
              </p>
              {progress && status === 'uploading' && (
                <p className="text-xs text-muted-foreground mt-1">
                  {progress.percentage}% • {formatFileSize(progress.loaded)} of{' '}
                  {formatFileSize(progress.total)}
                </p>
              )}
            </div>
          </div>
        )}

        {status === 'success' && file && (
          <div className="space-y-2">
            <CheckCircle2 className="h-10 w-10 mx-auto text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-600">Upload successful!</p>
              <p className="text-xs text-muted-foreground mt-1">{file.filename}</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-2">
            <XCircle className="h-10 w-10 mx-auto text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">Upload failed</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {status === 'uploading' && progress && (
        <Progress value={progress.percentage} className="h-2" />
      )}

      {/* Actions */}
      {(status === 'success' || status === 'error') && (
        <div className="flex justify-center">
          <Button onClick={handleReset} variant="outline" size="sm">
            Upload Another File
          </Button>
        </div>
      )}
    </div>
  );
}

