/**
 * API Keys API Client
 *
 * API functions for API key management.
 */

import { api } from '@/lib/api';
import type {
  ApiKey,
  ApiKeyCreated,
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
} from '@/types/api-keys';

/**
 * Create a new API key
 */
export async function createApiKey(
  orgId: string,
  data: CreateApiKeyRequest
): Promise<ApiKeyCreated> {
  try {
    const response = await api.post<ApiKeyCreated>('/api-keys', data);
    return response;
  } catch (error) {
    console.error('Failed to create API key:', error);
    throw error;
  }
}

/**
 * List all API keys for an organization
 */
export async function listApiKeys(_orgId: string): Promise<ApiKey[]> {
  try {
    const response = await api.get<{ data: ApiKey[]; total: number }>('/api-keys');
    return response.data;
  } catch (error) {
    console.error('Failed to list API keys:', error);
    throw error;
  }
}

/**
 * Get a single API key by ID
 */
export async function getApiKey(orgId: string, keyId: string): Promise<ApiKey> {
  try {
    const response = await api.get<ApiKey>(`/api-keys/${keyId}`);
    return response;
  } catch (error) {
    console.error('Failed to get API key:', error);
    throw error;
  }
}

/**
 * Update an API key's name or scopes
 */
export async function updateApiKey(
  orgId: string,
  keyId: string,
  data: UpdateApiKeyRequest
): Promise<ApiKey> {
  try {
    const response = await api.patch<ApiKey>(`/api-keys/${keyId}`, data);
    return response;
  } catch (error) {
    console.error('Failed to update API key:', error);
    throw error;
  }
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(orgId: string, keyId: string): Promise<void> {
  try {
    await api.delete<void>(`/api-keys/${keyId}`);
  } catch (error) {
    console.error('Failed to revoke API key:', error);
    throw error;
  }
}

/**
 * Rotate an API key (creates new key, revokes old)
 */
export async function rotateApiKey(
  orgId: string,
  keyId: string
): Promise<ApiKeyCreated> {
  try {
    const response = await api.post<ApiKeyCreated>(`/api-keys/${keyId}/rotate`);
    return response;
  } catch (error) {
    console.error('Failed to rotate API key:', error);
    throw error;
  }
}

