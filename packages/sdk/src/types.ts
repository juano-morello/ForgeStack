/**
 * ForgeStack SDK Types
 */

export type OrgRole = 'OWNER' | 'MEMBER';

export type ApiKeyScope =
  | 'projects:read' | 'projects:write'
  | 'members:read' | 'members:write'
  | 'billing:read' | 'billing:write'
  | 'files:read' | 'files:write'
  | 'api-keys:read' | 'api-keys:write'
  | '*';

export interface Organization {
  id: string;
  name: string;
  logo: string | null;
  timezone: string | null;
  language: string | null;
  createdAt: string;
  updatedAt: string;
  role?: OrgRole;
  memberCount?: number;
  effectivePermissions?: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: ApiKeyScope[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  isRevoked: boolean;
}

export interface ApiKeyCreated extends ApiKey {
  key: string; // Full key, shown only once
}

export interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
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

export interface Activity {
  id: string;
  type: string;
  resourceType: string;
  resourceId: string;
  userId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// Request DTOs
export interface CreateOrganizationRequest {
  name: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  logo?: string;
  timezone?: string;
  language?: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
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

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

