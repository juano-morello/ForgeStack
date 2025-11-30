/**
 * API Keys Types
 *
 * Type definitions for API key management.
 */

export type ApiKeyScope =
  | 'projects:read' | 'projects:write'
  | 'members:read' | 'members:write'
  | 'billing:read' | 'billing:write'
  | 'files:read' | 'files:write'
  | 'api-keys:read' | 'api-keys:write'
  | '*';

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: ApiKeyScope[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  isRevoked: boolean;
}

export interface ApiKeyCreated extends ApiKey {
  key: string; // Full key, shown only once
}

export interface CreateApiKeyRequest {
  name: string;
  scopes: ApiKeyScope[];
  expiresAt?: string;
}

export interface UpdateApiKeyRequest {
  name?: string;
  scopes?: ApiKeyScope[];
}

export interface ApiKeysResponse {
  items: ApiKey[];
  total: number;
}

