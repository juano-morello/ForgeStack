/**
 * Tests for useApiKeys Hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useApiKeys } from './use-api-keys';
import * as apiKeysApi from '@/lib/api/api-keys';
import type { ApiKey, ApiKeyCreated } from '@/types/api-keys';

// Mock the API module
vi.mock('@/lib/api/api-keys');

describe('useApiKeys', () => {
  const mockOrgId = 'org-123';
  const mockApiKeys: ApiKey[] = [
    {
      id: 'key-1',
      name: 'Test Key 1',
      keyPrefix: 'fsk_live_',
      scopes: ['projects:read'],
      lastUsedAt: null,
      expiresAt: null,
      createdAt: '2024-01-01T00:00:00Z',
      isRevoked: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch API keys on mount when autoFetch is true', async () => {
    vi.mocked(apiKeysApi.listApiKeys).mockResolvedValue(mockApiKeys);

    const { result } = renderHook(() =>
      useApiKeys({ orgId: mockOrgId, autoFetch: true })
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.apiKeys).toEqual(mockApiKeys);
    expect(apiKeysApi.listApiKeys).toHaveBeenCalledWith(mockOrgId);
  });

  it('should not fetch API keys on mount when autoFetch is false', () => {
    vi.mocked(apiKeysApi.listApiKeys).mockResolvedValue(mockApiKeys);

    renderHook(() => useApiKeys({ orgId: mockOrgId, autoFetch: false }));

    expect(apiKeysApi.listApiKeys).not.toHaveBeenCalled();
  });

  it('should create a new API key', async () => {
    const mockCreatedKey: ApiKeyCreated = {
      ...mockApiKeys[0],
      key: 'fsk_live_abc123',
    };

    vi.mocked(apiKeysApi.listApiKeys).mockResolvedValue([]);
    vi.mocked(apiKeysApi.createApiKey).mockResolvedValue(mockCreatedKey);

    const { result } = renderHook(() =>
      useApiKeys({ orgId: mockOrgId, autoFetch: false })
    );

    const newKey = await result.current.createKey({
      name: 'Test Key',
      scopes: ['projects:read'],
    });

    await waitFor(() => {
      expect(result.current.apiKeys).toHaveLength(1);
    });

    expect(newKey).toEqual(mockCreatedKey);
  });

  it('should revoke an API key', async () => {
    vi.mocked(apiKeysApi.listApiKeys).mockResolvedValue(mockApiKeys);
    vi.mocked(apiKeysApi.revokeApiKey).mockResolvedValue();

    const { result } = renderHook(() =>
      useApiKeys({ orgId: mockOrgId, autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.revokeKey('key-1');

    await waitFor(() => {
      expect(result.current.apiKeys[0].isRevoked).toBe(true);
    });

    expect(apiKeysApi.revokeApiKey).toHaveBeenCalledWith(mockOrgId, 'key-1');
  });

  it('should handle errors when fetching API keys', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(apiKeysApi.listApiKeys).mockRejectedValue(error);

    const { result } = renderHook(() =>
      useApiKeys({ orgId: mockOrgId, autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch API keys');
    expect(result.current.apiKeys).toEqual([]);
  });
});

