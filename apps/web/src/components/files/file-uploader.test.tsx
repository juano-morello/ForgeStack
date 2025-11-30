import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileUploader } from './file-uploader';

// Mock the upload hook
vi.mock('@/hooks/use-file-upload', () => ({
  useFileUpload: vi.fn(() => ({
    status: 'idle',
    progress: null,
    error: null,
    file: null,
    upload: vi.fn(),
    reset: vi.fn(),
  })),
}));

import { useFileUpload } from '@/hooks/use-file-upload';

describe('FileUploader', () => {
  const mockOrgId = 'org-123';
  const mockOnUpload = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload zone in idle state', () => {
    render(
      <FileUploader
        orgId={mockOrgId}
        purpose="avatar"
        onUpload={mockOnUpload}
        onError={mockOnError}
      />
    );

    expect(screen.getByText(/Drop file here or click to browse/i)).toBeInTheDocument();
    expect(screen.getByText(/JPG, PNG, GIF, WebP/i)).toBeInTheDocument();
  });

  it('shows uploading state', () => {
    vi.mocked(useFileUpload).mockReturnValue({
      status: 'uploading',
      progress: { loaded: 50, total: 100, percentage: 50 },
      error: null,
      file: null,
      upload: vi.fn(),
      reset: vi.fn(),
    });

    render(
      <FileUploader
        orgId={mockOrgId}
        purpose="avatar"
        onUpload={mockOnUpload}
        onError={mockOnError}
      />
    );

    expect(screen.getByText(/Uploading.../i)).toBeInTheDocument();
    expect(screen.getByText(/50%/i)).toBeInTheDocument();
  });

  it('shows success state', () => {
    vi.mocked(useFileUpload).mockReturnValue({
      status: 'success',
      progress: { loaded: 100, total: 100, percentage: 100 },
      error: null,
      file: {
        id: 'file-123',
        filename: 'test.jpg',
        contentType: 'image/jpeg',
        size: 1024,
        purpose: 'avatar',
        url: 'https://example.com/test.jpg',
        createdAt: new Date().toISOString(),
      },
      upload: vi.fn(),
      reset: vi.fn(),
    });

    render(
      <FileUploader
        orgId={mockOrgId}
        purpose="avatar"
        onUpload={mockOnUpload}
        onError={mockOnError}
      />
    );

    expect(screen.getByText(/Upload successful!/i)).toBeInTheDocument();
    expect(screen.getByText(/test.jpg/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    vi.mocked(useFileUpload).mockReturnValue({
      status: 'error',
      progress: null,
      error: 'File too large',
      file: null,
      upload: vi.fn(),
      reset: vi.fn(),
    });

    render(
      <FileUploader
        orgId={mockOrgId}
        purpose="avatar"
        onUpload={mockOnUpload}
        onError={mockOnError}
      />
    );

    expect(screen.getByText(/Upload failed/i)).toBeInTheDocument();
    expect(screen.getByText(/File too large/i)).toBeInTheDocument();
  });

  it('handles drag and drop', () => {
    vi.mocked(useFileUpload).mockReturnValue({
      status: 'idle',
      progress: null,
      error: null,
      file: null,
      upload: vi.fn(),
      reset: vi.fn(),
    });

    render(
      <FileUploader
        orgId={mockOrgId}
        purpose="avatar"
        onUpload={mockOnUpload}
        onError={mockOnError}
      />
    );

    const dropZone = screen.getByText(/Drop file here or click to browse/i).closest('div');
    expect(dropZone).toBeInTheDocument();

    // Test that drag events can be fired without errors
    if (dropZone) {
      fireEvent.dragOver(dropZone);
      fireEvent.dragLeave(dropZone);
      // Component should still be in the document after drag events
      expect(dropZone).toBeInTheDocument();
    }
  });

  it('accepts correct file types for avatar', () => {
    render(
      <FileUploader
        orgId={mockOrgId}
        purpose="avatar"
        onUpload={mockOnUpload}
        onError={mockOnError}
      />
    );

    const input = document.querySelector('input[type="file"]');
    expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/gif,image/webp');
  });

  it('accepts correct file types for logo', () => {
    render(
      <FileUploader
        orgId={mockOrgId}
        purpose="logo"
        onUpload={mockOnUpload}
        onError={mockOnError}
      />
    );

    const input = document.querySelector('input[type="file"]');
    expect(input).toHaveAttribute(
      'accept',
      'image/jpeg,image/png,image/gif,image/webp,image/svg+xml'
    );
  });
});

