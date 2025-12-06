import { describe, it, expect } from 'vitest';
import type {
  Organization,
  Project,
  ApiKey,
  ApiKeyCreated,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
  PaginatedResponse,
  QueryParams,
  User,
  Activity,
  DashboardSummary,
  OrgRole,
  ApiKeyScope,
} from '../types';

describe('Type Exports', () => {
  it('should export Organization type', () => {
    const org: Organization = {
      id: 'org-1',
      name: 'Test Org',
      slug: 'test-org',
      role: 'owner',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    expect(org).toBeDefined();
  });

  it('should export Project type', () => {
    const project: Project = {
      id: 'proj-1',
      name: 'Test Project',
      slug: 'test-project',
      organizationId: 'org-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    expect(project).toBeDefined();
  });

  it('should export ApiKey type', () => {
    const apiKey: ApiKey = {
      id: 'key-1',
      name: 'Test Key',
      prefix: 'fsk_test',
      scopes: ['read:projects'],
      lastUsedAt: null,
      expiresAt: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    expect(apiKey).toBeDefined();
  });

  it('should export ApiKeyCreated type', () => {
    const apiKeyCreated: ApiKeyCreated = {
      id: 'key-1',
      name: 'Test Key',
      prefix: 'fsk_test',
      key: 'fsk_test_secret123',
      scopes: ['read:projects'],
      lastUsedAt: null,
      expiresAt: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    expect(apiKeyCreated).toBeDefined();
  });

  it('should export request types', () => {
    const createOrgReq: CreateOrganizationRequest = {
      name: 'New Org',
      slug: 'new-org',
    };
    const updateOrgReq: UpdateOrganizationRequest = {
      name: 'Updated Org',
    };
    const createProjReq: CreateProjectRequest = {
      name: 'New Project',
      slug: 'new-project',
      organizationId: 'org-1',
    };
    const updateProjReq: UpdateProjectRequest = {
      name: 'Updated Project',
    };
    const createKeyReq: CreateApiKeyRequest = {
      name: 'New Key',
      scopes: ['read:projects'],
    };
    const updateKeyReq: UpdateApiKeyRequest = {
      name: 'Updated Key',
    };

    expect(createOrgReq).toBeDefined();
    expect(updateOrgReq).toBeDefined();
    expect(createProjReq).toBeDefined();
    expect(updateProjReq).toBeDefined();
    expect(createKeyReq).toBeDefined();
    expect(updateKeyReq).toBeDefined();
  });

  it('should export PaginatedResponse type', () => {
    const response: PaginatedResponse<Organization> = {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    };
    expect(response).toBeDefined();
  });

  it('should export QueryParams type', () => {
    const params: QueryParams = {
      page: 1,
      limit: 10,
      search: 'test',
    };
    expect(params).toBeDefined();
  });

  it('should export User type', () => {
    const user: User = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      image: null,
      createdAt: '2024-01-01T00:00:00Z',
    };
    expect(user).toBeDefined();
  });

  it('should export Activity type', () => {
    const activity: Activity = {
      id: 'act-1',
      type: 'project.created',
      resourceType: 'project',
      resourceId: 'proj-1',
      userId: 'user-1',
      metadata: {},
      createdAt: '2024-01-01T00:00:00Z',
    };
    expect(activity).toBeDefined();
  });

  it('should export DashboardSummary type', () => {
    const summary: DashboardSummary = {
      stats: {
        projects: 5,
        members: 10,
        apiKeys: 3,
        storageUsedBytes: 1024000,
      },
      recentActivity: [],
      recentProjects: [],
    };
    expect(summary).toBeDefined();
  });

  it('should export OrgRole type', () => {
    const role: OrgRole = 'owner';
    expect(role).toBeDefined();
  });

  it('should export ApiKeyScope type', () => {
    const scope: ApiKeyScope = 'read:projects';
    expect(scope).toBeDefined();
  });
});

