/**
 * API Keys Types
 *
 * Extended type definitions for API key management.
 * Base types imported from @forgestack/shared
 */

// Re-export base types from shared
export type { ApiKeyScope, BaseApiKey, ApiKeyWithSecret, CreateApiKeyInput, UpdateApiKeyInput } from '@forgestack/shared/browser';

// Aliases for backward compatibility
import type { BaseApiKey, ApiKeyWithSecret, CreateApiKeyInput, UpdateApiKeyInput } from '@forgestack/shared/browser';
export type ApiKey = BaseApiKey;
export type ApiKeyCreated = ApiKeyWithSecret;
export type CreateApiKeyRequest = CreateApiKeyInput;
export type UpdateApiKeyRequest = UpdateApiKeyInput;

// Web-specific response types
export interface ApiKeysResponse {
  items: ApiKey[];
  total: number;
}

