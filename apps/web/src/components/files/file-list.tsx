'use client';

/**
 * File List Component
 *
 * Displays a list of uploaded files with download and delete actions.
 */

import { useState } from 'react';
import { Download, Trash2, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { formatFileSize } from '@/lib/file-constants';
import { deleteFile } from '@/lib/api/files';
import type { FileRecord } from '@/types/files';

export interface FileListProps {
  orgId: string;
  files: FileRecord[];
  onDelete?: (fileId: string) => void;
  isLoading?: boolean;
}

export function FileList({ orgId, files, onDelete, isLoading }: FileListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<FileRecord | null>(null);

  const handleDownload = (file: FileRecord) => {
    window.open(file.url, '_blank');
  };

  const handleDeleteClick = (file: FileRecord) => {
    setFileToDelete(file);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    setDeletingId(fileToDelete.id);
    try {
      await deleteFile(orgId, fileToDelete.id);
      onDelete?.(fileToDelete.id);
    } catch (error) {
      console.error('Failed to delete file:', error);
    } finally {
      setDeletingId(null);
      setFileToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setFileToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <EmptyState
        icon={File}
        title="No files"
        description="No files have been uploaded yet."
      />
    );
  }

  return (
    <>
      <div className="space-y-2">
        {files.map((file) => (
          <Card key={file.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(file)}
                    disabled={deletingId === file.id}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(file)}
                    disabled={deletingId === file.id}
                  >
                    {deletingId === file.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!fileToDelete} onOpenChange={handleDeleteCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{fileToDelete?.filename}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

