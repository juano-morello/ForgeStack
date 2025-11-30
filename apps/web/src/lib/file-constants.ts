/**
 * File Upload Constants
 *
 * Configuration for file upload validation and limits.
 */

import type { FilePurpose } from '@/types/files';

export const FILE_CONFIG = {
  avatar: {
    maxSize: 5 * 1024 * 1024, // 5MB
    accept: 'image/jpeg,image/png,image/gif,image/webp',
    acceptLabel: 'JPG, PNG, GIF, WebP',
  },
  logo: {
    maxSize: 5 * 1024 * 1024, // 5MB
    accept: 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml',
    acceptLabel: 'JPG, PNG, GIF, WebP, SVG',
  },
  attachment: {
    maxSize: 50 * 1024 * 1024, // 50MB
    accept: '*/*',
    acceptLabel: 'Any file type',
  },
} as const;

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validate file against purpose constraints
 */
export function validateFile(
  file: File,
  purpose: FilePurpose
): { valid: boolean; error?: string } {
  const config = FILE_CONFIG[purpose];

  // Check file size
  if (file.size > config.maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${formatFileSize(config.maxSize)}`,
    };
  }

  // Check file type (skip for attachment which accepts all)
  if (purpose !== 'attachment') {
    const acceptedTypes = config.accept.split(',');
    if (!acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type must be one of: ${config.acceptLabel}`,
      };
    }
  }

  return { valid: true };
}

