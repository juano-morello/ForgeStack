/**
 * API Key Response DTOs
 */

export class ApiKeyDto {
  id!: string;
  name!: string;
  keyPrefix!: string;
  scopes!: string[];
  lastUsedAt!: string | null;
  expiresAt!: string | null;
  revokedAt!: string | null;
  createdAt!: string;
  isRevoked!: boolean;
}

export class ApiKeyCreatedDto extends ApiKeyDto {
  key!: string; // Full key, shown only on creation
}

