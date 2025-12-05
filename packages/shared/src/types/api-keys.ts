/**
 * API Key Types
 * Types for API key management
 */

export type ApiKeyScope =
  | 'projects:read' | 'projects:write'
  | 'members:read' | 'members:write'
  | 'billing:read' | 'billing:write'
  | 'files:read' | 'files:write'
  | 'api-keys:read' | 'api-keys:write'
  | '*';

export interface BaseApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: ApiKeyScope[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt?: string | null;
  createdAt: string;
  isRevoked: boolean;
}

export interface ApiKeyWithSecret extends BaseApiKey {
  key: string; // Full key, shown only on creation
}

export interface CreateApiKeyInput {
  name: string;
  scopes: ApiKeyScope[];
  expiresAt?: string;
}

export interface UpdateApiKeyInput {
  name?: string;
  scopes?: ApiKeyScope[];
}

