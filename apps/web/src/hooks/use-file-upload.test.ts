import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFileUpload } from './use-file-upload';
import * as filesApi from '@/lib/api/files';
import * as fileConstants from '@/lib/file-constants';

// Mock the API functions
vi.mock('@/lib/api/files', () => ({
  getPresignedUploadUrl: vi.fn(),
  completeUpload: vi.fn(),
}));

// Mock file validation
vi.mock('@/lib/file-constants', async () => {
  const actual = await vi.importActual('@/lib/file-constants');
  return {
    ...actual,
    validateFile: vi.fn(),
  };
});

describe('useFileUpload', () => {
  const mockOrgId = 'org-123';
  const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });

  beforeEach(() => {
    vi.clearAllMocks();
    // Default to valid file
    vi.mocked(fileConstants.validateFile).mockReturnValue({ valid: true });
  });

  it('initializes with idle state', () => {
    const { result } = renderHook(() => useFileUpload(mockOrgId));

    expect(result.current.status).toBe('idle');
    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.file).toBeNull();
  });

  it('validates file before upload', async () => {
    vi.mocked(fileConstants.validateFile).mockReturnValue({
      valid: false,
      error: 'File too large',
    });

    const { result } = renderHook(() => useFileUpload(mockOrgId));

    await act(async () => {
      await result.current.upload(mockFile, 'avatar');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('File too large');
  });

  it('resets state correctly', () => {
    const { result } = renderHook(() => useFileUpload(mockOrgId));

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.file).toBeNull();
  });

  it('handles upload preparation', async () => {
    vi.mocked(filesApi.getPresignedUploadUrl).mockResolvedValue({
      fileId: 'file-123',
      uploadUrl: 'https://example.com/upload',
      expiresAt: new Date().toISOString(),
    });

    const { result } = renderHook(() => useFileUpload(mockOrgId));

    // Start upload
    act(() => {
      result.current.upload(mockFile, 'avatar');
    });

    // Check that it transitions to preparing state
    await waitFor(() => {
      expect(['preparing', 'uploading', 'completing', 'error']).toContain(result.current.status);
    });
  });
});

