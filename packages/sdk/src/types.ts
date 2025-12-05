/**
 * ForgeStack SDK Types
 * Extended from @forgestack/shared with SDK-specific types
 */

// Re-export all shared types
export type {
  OrgRole,
  ApiKeyScope,
  BaseOrganization,
  OrganizationWithRole,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  BaseProject,
  CreateProjectInput,
  UpdateProjectInput,
  BaseApiKey,
  ApiKeyWithSecret,
  CreateApiKeyInput,
  UpdateApiKeyInput,
  PaginatedResponse,
  PaginationParams,
  WebhookEventType,
  WebhookPayload,
} from '@forgestack/shared';

// Aliases for SDK backward compatibility
import type { OrganizationWithRole, BaseProject, BaseApiKey, ApiKeyWithSecret, CreateOrganizationInput, UpdateOrganizationInput, CreateProjectInput, UpdateProjectInput, CreateApiKeyInput, UpdateApiKeyInput } from '@forgestack/shared';

export type Organization = OrganizationWithRole;
export type Project = BaseProject;
export type ApiKey = BaseApiKey;
export type ApiKeyCreated = ApiKeyWithSecret;

// Request type aliases
export type CreateOrganizationRequest = CreateOrganizationInput;
export type UpdateOrganizationRequest = UpdateOrganizationInput;
export type CreateProjectRequest = CreateProjectInput;
export type UpdateProjectRequest = UpdateProjectInput;
export type CreateApiKeyRequest = CreateApiKeyInput;
export type UpdateApiKeyRequest = UpdateApiKeyInput;

// SDK-specific types
export interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: string;
  resourceType: string;
  resourceId: string;
  userId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardSummary {
  stats: {
    projects: number;
    members: number;
    apiKeys: number;
    storageUsedBytes: number;
  };
  recentActivity: Activity[];
  recentProjects: Project[];
  orgHealth?: {
    subscriptionStatus: string;
    usageSummary: {
      apiCalls: number;
      storage: number;
      seats: number;
    };
  };
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

