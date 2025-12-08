/**
 * useImpersonation Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useImpersonation } from './use-impersonation';
import { impersonationApi, ApiError } from '@/lib/api';
import type { ImpersonationSession, ImpersonationStatusResponse } from '@/lib/api';

// Mock the API
vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual('@/lib/api');
  return {
    ...actual,
    impersonationApi: {
      getStatus: vi.fn(),
      end: vi.fn(),
    },
  };
});

// Mock window.location
delete (window as any).location;
window.location = { href: '' } as any;

describe('useImpersonation', () => {
  const mockSession: ImpersonationSession = {
    sessionId: 'session-123',
    targetUser: {
      id: 'user-123',
      email: 'target@example.com',
      name: 'Target User',
    },
    startedAt: '2024-01-15T10:00:00Z',
    expiresAt: '2024-01-15T11:00:00Z',
    remainingSeconds: 3600,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches impersonation status on mount', async () => {
    const mockResponse: ImpersonationStatusResponse = {
      isImpersonating: true,
      session: mockSession,
    };

    vi.mocked(impersonationApi.getStatus).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useImpersonation());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isImpersonating).toBe(true);
    expect(result.current.session).toEqual(mockSession);
    expect(result.current.remainingTime).toBe(3600);
    expect(result.current.error).toBeNull();
  });

  it('returns isImpersonating = true when session exists', async () => {
    const mockResponse: ImpersonationStatusResponse = {
      isImpersonating: true,
      session: mockSession,
    };

    vi.mocked(impersonationApi.getStatus).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useImpersonation());

    await waitFor(() => {
      expect(result.current.isImpersonating).toBe(true);
    });

    expect(result.current.session).toEqual(mockSession);
  });

  it('returns isImpersonating = false when no session', async () => {
    const mockResponse: ImpersonationStatusResponse = {
      isImpersonating: false,
      session: null,
    };

    vi.mocked(impersonationApi.getStatus).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useImpersonation());

    await waitFor(() => {
      expect(result.current.isImpersonating).toBe(false);
    });

    expect(result.current.session).toBeNull();
    expect(result.current.remainingTime).toBe(0);
  });

  it('handles loading state', async () => {
    vi.mocked(impersonationApi.getStatus).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { result } = renderHook(() => useImpersonation());

    expect(result.current.isLoading).toBe(true);
  });

  it('handles 401 errors silently (no session)', async () => {
    vi.mocked(impersonationApi.getStatus).mockRejectedValue(
      new ApiError('Unauthorized', 401)
    );

    const { result } = renderHook(() => useImpersonation());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.session).toBeNull();
    expect(result.current.remainingTime).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('handles 403 errors silently (no session)', async () => {
    vi.mocked(impersonationApi.getStatus).mockRejectedValue(
      new ApiError('Forbidden', 403)
    );

    const { result } = renderHook(() => useImpersonation());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.session).toBeNull();
    expect(result.current.remainingTime).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('handles other API errors and sets error state', async () => {
    const errorMessage = 'Internal server error';
    vi.mocked(impersonationApi.getStatus).mockRejectedValue(
      new ApiError(errorMessage, 500)
    );

    const { result } = renderHook(() => useImpersonation());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
  });

  it('handles non-ApiError errors', async () => {
    vi.mocked(impersonationApi.getStatus).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useImpersonation());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch impersonation status');
  });

  it('endImpersonation calls API and clears session', async () => {
    const mockResponse: ImpersonationStatusResponse = {
      isImpersonating: true,
      session: mockSession,
    };

    vi.mocked(impersonationApi.getStatus).mockResolvedValue(mockResponse);
    vi.mocked(impersonationApi.end).mockResolvedValue({
      success: true,
      session: {
        duration: 1800,
        actionsPerformed: 15,
        endedAt: '2024-01-15T10:30:00Z',
      },
    });

    const { result } = renderHook(() => useImpersonation());

    await waitFor(() => {
      expect(result.current.session).toEqual(mockSession);
    });

    await act(async () => {
      await result.current.endImpersonation();
    });

    expect(impersonationApi.end).toHaveBeenCalled();
    expect(result.current.session).toBeNull();
    expect(result.current.remainingTime).toBe(0);
    expect(window.location.href).toBe('/admin');
  });

  it('endImpersonation handles errors', async () => {
    const mockResponse: ImpersonationStatusResponse = {
      isImpersonating: true,
      session: mockSession,
    };

    const errorMessage = 'Failed to end session';
    const error = new ApiError(errorMessage, 500);
    vi.mocked(impersonationApi.getStatus).mockResolvedValue(mockResponse);
    vi.mocked(impersonationApi.end).mockRejectedValue(error);

    const { result } = renderHook(() => useImpersonation());

    await waitFor(() => {
      expect(result.current.session).toEqual(mockSession);
    });

    // Should throw the error
    await expect(
      act(async () => {
        await result.current.endImpersonation();
      })
    ).rejects.toThrow(error);

    // API should have been called
    expect(impersonationApi.end).toHaveBeenCalled();
  });

  it('sets initial remainingTime from session', async () => {
    const mockResponse: ImpersonationStatusResponse = {
      isImpersonating: true,
      session: { ...mockSession, remainingSeconds: 1234 },
    };

    vi.mocked(impersonationApi.getStatus).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useImpersonation());

    await waitFor(() => {
      expect(result.current.remainingTime).toBe(1234);
    });
  });

  it('refresh calls API again', async () => {
    const mockResponse: ImpersonationStatusResponse = {
      isImpersonating: true,
      session: mockSession,
    };

    vi.mocked(impersonationApi.getStatus).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useImpersonation());

    await waitFor(() => {
      expect(result.current.session).toEqual(mockSession);
    });

    const initialCallCount = vi.mocked(impersonationApi.getStatus).mock.calls.length;

    await act(async () => {
      await result.current.refresh();
    });

    expect(vi.mocked(impersonationApi.getStatus).mock.calls.length).toBeGreaterThan(
      initialCallCount
    );
  });
});

