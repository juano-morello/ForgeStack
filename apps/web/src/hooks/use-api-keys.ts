'use client';

/**
 * useApiKeys Hook
 *
 * Hook for managing API keys state.
 * Provides methods to fetch, create, update, revoke, and rotate API keys.
 */

import { useState, useCallback, useEffect } from 'react';
import { ApiError } from '@/lib/api';
import {
  listApiKeys,
  createApiKey as createApiKeyApi,
  updateApiKey as updateApiKeyApi,
  revokeApiKey as revokeApiKeyApi,
  rotateApiKey as rotateApiKeyApi,
} from '@/lib/api/api-keys';
import type {
  ApiKey,
  ApiKeyCreated,
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
} from '@/types/api-keys';

interface UseApiKeysOptions {
  orgId: string;
  autoFetch?: boolean;
}

export function useApiKeys({ orgId, autoFetch = true }: UseApiKeysOptions) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch API keys
  const fetchApiKeys = useCallback(async () => {
    if (!orgId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await listApiKeys(orgId);
      setApiKeys(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch API keys';
      setError(message);
      console.error('Error fetching API keys:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  // Create API key
  const createKey = useCallback(
    async (data: CreateApiKeyRequest): Promise<ApiKeyCreated> => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      setError(null);

      try {
        const newKey = await createApiKeyApi(orgId, data);
        // Add to list (without the full key)
        setApiKeys((prev) => [
          {
            id: newKey.id,
            name: newKey.name,
            keyPrefix: newKey.keyPrefix,
            scopes: newKey.scopes,
            lastUsedAt: newKey.lastUsedAt,
            expiresAt: newKey.expiresAt,
            createdAt: newKey.createdAt,
            isRevoked: newKey.isRevoked,
          },
          ...prev,
        ]);
        return newKey;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to create API key';
        setError(message);
        throw err;
      }
    },
    [orgId]
  );

  // Update API key
  const updateKey = useCallback(
    async (keyId: string, data: UpdateApiKeyRequest): Promise<ApiKey> => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      setError(null);

      try {
        const updatedKey = await updateApiKeyApi(orgId, keyId, data);
        setApiKeys((prev) =>
          prev.map((key) => (key.id === keyId ? updatedKey : key))
        );
        return updatedKey;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to update API key';
        setError(message);
        throw err;
      }
    },
    [orgId]
  );

  // Revoke API key
  const revokeKey = useCallback(
    async (keyId: string): Promise<void> => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      setError(null);

      try {
        await revokeApiKeyApi(orgId, keyId);
        // Mark as revoked in the list
        setApiKeys((prev) =>
          prev.map((key) =>
            key.id === keyId ? { ...key, isRevoked: true } : key
          )
        );
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to revoke API key';
        setError(message);
        throw err;
      }
    },
    [orgId]
  );

  // Rotate API key
  const rotateKey = useCallback(
    async (keyId: string): Promise<ApiKeyCreated> => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      setError(null);

      try {
        const newKey = await rotateApiKeyApi(orgId, keyId);
        // Replace old key with new one in the list
        setApiKeys((prev) =>
          prev.map((key) =>
            key.id === keyId
              ? {
                  id: newKey.id,
                  name: newKey.name,
                  keyPrefix: newKey.keyPrefix,
                  scopes: newKey.scopes,
                  lastUsedAt: newKey.lastUsedAt,
                  expiresAt: newKey.expiresAt,
                  createdAt: newKey.createdAt,
                  isRevoked: newKey.isRevoked,
                }
              : key
          )
        );
        return newKey;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to rotate API key';
        setError(message);
        throw err;
      }
    },
    [orgId]
  );

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && orgId) {
      fetchApiKeys();
    }
  }, [autoFetch, orgId, fetchApiKeys]);

  return {
    apiKeys,
    isLoading,
    error,
    fetchApiKeys,
    createKey,
    updateKey,
    revokeKey,
    rotateKey,
  };
}

