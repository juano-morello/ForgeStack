'use client';

/**
 * Avatar Uploader Component
 *
 * Circular avatar uploader with preview.
 * Shows current avatar or placeholder, uploads on click.
 */

import { useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFileUpload } from '@/hooks/use-file-upload';
import type { FileRecord } from '@/types/files';

export interface AvatarUploaderProps {
  orgId: string;
  currentUrl?: string | null;
  onUpload?: (file: FileRecord) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fallback?: string;
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
};

const iconSizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function AvatarUploader({
  orgId,
  currentUrl,
  onUpload,
  size = 'md',
  disabled = false,
  fallback = 'U',
}: AvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { status, upload, reset } = useFileUpload(orgId);

  const isUploading = status === 'preparing' || status === 'uploading' || status === 'completing';

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const result = await upload(selectedFile, 'avatar');
      if (result) {
        onUpload?.(result);
        reset();
      }
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="relative inline-block">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <div
        onClick={handleClick}
        className={cn(
          'relative group cursor-pointer',
          (disabled || isUploading) && 'cursor-not-allowed opacity-50'
        )}
      >
        <Avatar className={cn(sizeClasses[size], 'border-2 border-muted')}>
          <AvatarImage src={currentUrl || undefined} alt="Avatar" />
          <AvatarFallback className="bg-primary/10 text-primary text-lg">
            {fallback}
          </AvatarFallback>
        </Avatar>

        {/* Overlay */}
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity',
            isUploading && 'opacity-100'
          )}
        >
          {isUploading ? (
            <Loader2 className={cn(iconSizeClasses[size], 'text-white animate-spin')} />
          ) : (
            <Camera className={cn(iconSizeClasses[size], 'text-white')} />
          )}
        </div>
      </div>

      {/* Status Text */}
      {isUploading && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          {status === 'preparing' && 'Preparing...'}
          {status === 'uploading' && 'Uploading...'}
          {status === 'completing' && 'Completing...'}
        </p>
      )}
    </div>
  );
}

