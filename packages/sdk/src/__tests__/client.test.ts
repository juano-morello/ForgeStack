import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ForgeStackClient } from '../client';
import type {
  Organization,
  Project,
  ApiKey,
  ApiKeyCreated,
  DashboardSummary,
  PaginatedResponse,
} from '../types';

describe('ForgeStackClient', () => {
  let client: ForgeStackClient;
  const mockFetch = vi.fn();
  const baseUrl = 'https://api.forgestack.com';
  const apiKey = 'test-api-key';
  const accessToken = 'test-access-token';
  const orgId = 'org-123';

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create client with API key', () => {
      client = new ForgeStackClient({ baseUrl, apiKey });
      expect(client).toBeInstanceOf(ForgeStackClient);
    });

    it('should create client with access token', () => {
      client = new ForgeStackClient({ baseUrl, accessToken });
      expect(client).toBeInstanceOf(ForgeStackClient);
    });

    it('should create client with base URL override', () => {
      const customUrl = 'https://custom.api.com';
      client = new ForgeStackClient({ baseUrl: customUrl, apiKey });
      expect(client).toBeInstanceOf(ForgeStackClient);
    });

    it('should create client with orgId', () => {
      client = new ForgeStackClient({ baseUrl, apiKey, orgId });
      expect(client).toBeInstanceOf(ForgeStackClient);
    });
  });

  describe('Authentication Headers', () => {
    it('should set X-API-Key header when using API key', async () => {
      client = new ForgeStackClient({ baseUrl, apiKey });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });

      await client.healthCheck();

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/health`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': apiKey,
          }),
        })
      );
    });

    it('should set Authorization header when using access token', async () => {
      client = new ForgeStackClient({ baseUrl, accessToken });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });

      await client.healthCheck();

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/health`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${accessToken}`,
          }),
        })
      );
    });

    it('should set X-Org-Id header when orgId is provided', async () => {
      client = new ForgeStackClient({ baseUrl, apiKey, orgId });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });

      await client.healthCheck();

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/health`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Org-Id': orgId,
          }),
        })
      );
    });

    it('should set both API key and access token headers when both provided', async () => {
      client = new ForgeStackClient({ baseUrl, apiKey, accessToken });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });

      await client.healthCheck();

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/health`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': apiKey,
            Authorization: `Bearer ${accessToken}`,
          }),
        })
      );
    });
  });

  describe('Organizations', () => {
    beforeEach(() => {
      client = new ForgeStackClient({ baseUrl, apiKey });
    });

    it('should list organizations', async () => {
      const mockResponse: PaginatedResponse<Organization> = {
        data: [
          {
            id: 'org-1',
            name: 'Test Org',
            slug: 'test-org',
            role: 'owner',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.listOrganizations();

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/organizations`,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should list organizations with query params', async () => {
      const mockResponse: PaginatedResponse<Organization> = {
        data: [],
        pagination: { page: 2, limit: 20, total: 0, totalPages: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.listOrganizations({ page: 2, limit: 20, search: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/organizations?page=2&limit=20&search=test`,
        expect.any(Object)
      );
    });

    it('should get organization by id', async () => {
      const mockOrg: Organization = {
        id: 'org-1',
        name: 'Test Org',
        slug: 'test-org',
        role: 'owner',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrg,
      });

      const result = await client.getOrganization('org-1');

      expect(result).toEqual(mockOrg);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/organizations/org-1`,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should create organization', async () => {
      const createData = { name: 'New Org', slug: 'new-org' };
      const mockOrg: Organization = {
        id: 'org-2',
        ...createData,
        role: 'owner',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrg,
      });

      const result = await client.createOrganization(createData);

      expect(result).toEqual(mockOrg);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/organizations`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(createData),
        })
      );
    });

    it('should update organization', async () => {
      const updateData = { name: 'Updated Org' };
      const mockOrg: Organization = {
        id: 'org-1',
        name: 'Updated Org',
        slug: 'test-org',
        role: 'owner',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrg,
      });

      const result = await client.updateOrganization('org-1', updateData);

      expect(result).toEqual(mockOrg);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/organizations/org-1`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updateData),
        })
      );
    });

    it('should delete organization', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => undefined,
      });

      await client.deleteOrganization('org-1');

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/organizations/org-1`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Projects', () => {
    beforeEach(() => {
      client = new ForgeStackClient({ baseUrl, apiKey });
    });

    it('should list projects', async () => {
      const mockResponse: PaginatedResponse<Project> = {
        data: [
          {
            id: 'proj-1',
            name: 'Test Project',
            slug: 'test-project',
            organizationId: 'org-1',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.listProjects();

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/projects`,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should get project by id', async () => {
      const mockProject: Project = {
        id: 'proj-1',
        name: 'Test Project',
        slug: 'test-project',
        organizationId: 'org-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProject,
      });

      const result = await client.getProject('proj-1');

      expect(result).toEqual(mockProject);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/projects/proj-1`,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should create project', async () => {
      const createData = {
        name: 'New Project',
        slug: 'new-project',
        organizationId: 'org-1',
      };
      const mockProject: Project = {
        id: 'proj-2',
        ...createData,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProject,
      });

      const result = await client.createProject(createData);

      expect(result).toEqual(mockProject);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/projects`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(createData),
        })
      );
    });

    it('should update project', async () => {
      const updateData = { name: 'Updated Project' };
      const mockProject: Project = {
        id: 'proj-1',
        name: 'Updated Project',
        slug: 'test-project',
        organizationId: 'org-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProject,
      });

      const result = await client.updateProject('proj-1', updateData);

      expect(result).toEqual(mockProject);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/projects/proj-1`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updateData),
        })
      );
    });

    it('should delete project', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => undefined,
      });

      await client.deleteProject('proj-1');

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/projects/proj-1`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('API Keys', () => {
    beforeEach(() => {
      client = new ForgeStackClient({ baseUrl, apiKey });
    });

    it('should list API keys', async () => {
      const mockResponse: PaginatedResponse<ApiKey> = {
        data: [
          {
            id: 'key-1',
            name: 'Test Key',
            prefix: 'fsk_test',
            scopes: ['read:projects'],
            lastUsedAt: null,
            expiresAt: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.listApiKeys();

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api-keys`,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should create API key', async () => {
      const createData = {
        name: 'New Key',
        scopes: ['read:projects'] as const,
      };
      const mockApiKey: ApiKeyCreated = {
        id: 'key-2',
        name: 'New Key',
        prefix: 'fsk_new',
        key: 'fsk_new_secret123',
        scopes: ['read:projects'],
        lastUsedAt: null,
        expiresAt: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiKey,
      });

      const result = await client.createApiKey(createData);

      expect(result).toEqual(mockApiKey);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api-keys`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(createData),
        })
      );
    });

    it('should get API key by id', async () => {
      const mockApiKey: ApiKey = {
        id: 'key-1',
        name: 'Test Key',
        prefix: 'fsk_test',
        scopes: ['read:projects'],
        lastUsedAt: null,
        expiresAt: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiKey,
      });

      const result = await client.getApiKey('key-1');

      expect(result).toEqual(mockApiKey);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api-keys/key-1`,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should update API key', async () => {
      const updateData = { name: 'Updated Key' };
      const mockApiKey: ApiKey = {
        id: 'key-1',
        name: 'Updated Key',
        prefix: 'fsk_test',
        scopes: ['read:projects'],
        lastUsedAt: null,
        expiresAt: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiKey,
      });

      const result = await client.updateApiKey('key-1', updateData);

      expect(result).toEqual(mockApiKey);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api-keys/key-1`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updateData),
        })
      );
    });

    it('should revoke API key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => undefined,
      });

      await client.revokeApiKey('key-1');

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api-keys/key-1`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should rotate API key', async () => {
      const mockApiKey: ApiKeyCreated = {
        id: 'key-1',
        name: 'Test Key',
        prefix: 'fsk_test',
        key: 'fsk_test_newsecret456',
        scopes: ['read:projects'],
        lastUsedAt: null,
        expiresAt: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiKey,
      });

      const result = await client.rotateApiKey('key-1');

      expect(result).toEqual(mockApiKey);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api-keys/key-1/rotate`,
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('Dashboard', () => {
    beforeEach(() => {
      client = new ForgeStackClient({ baseUrl, apiKey });
    });

    it('should get dashboard summary', async () => {
      const mockSummary: DashboardSummary = {
        stats: {
          projects: 5,
          members: 10,
          apiKeys: 3,
          storageUsedBytes: 1024000,
        },
        recentActivity: [],
        recentProjects: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummary,
      });

      const result = await client.getDashboardSummary();

      expect(result).toEqual(mockSummary);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/dashboard/summary`,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('Health Check', () => {
    beforeEach(() => {
      client = new ForgeStackClient({ baseUrl, apiKey });
    });

    it('should perform health check', async () => {
      const mockHealth = { status: 'ok' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth,
      });

      const result = await client.healthCheck();

      expect(result).toEqual(mockHealth);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/health`,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      client = new ForgeStackClient({ baseUrl, apiKey });
    });

    it('should throw error when API returns 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      });

      await expect(client.getOrganization('non-existent')).rejects.toThrow(
        'API Error: 404 Not Found'
      );
    });

    it('should throw error when API returns 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({}),
      });

      await expect(client.listOrganizations()).rejects.toThrow(
        'API Error: 401 Unauthorized'
      );
    });

    it('should throw error when API returns 500', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      });

      await expect(client.listProjects()).rejects.toThrow(
        'API Error: 500 Internal Server Error'
      );
    });

    it('should call onError callback when error occurs', async () => {
      const onError = vi.fn();
      client = new ForgeStackClient({ baseUrl, apiKey, onError });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      });

      await expect(client.getOrganization('non-existent')).rejects.toThrow();
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'API Error: 404 Not Found',
        })
      );
    });
  });

  describe('Context Management', () => {
    beforeEach(() => {
      client = new ForgeStackClient({ baseUrl, apiKey });
    });

    it('should set organization context', async () => {
      client.setOrganization('org-456');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });

      await client.healthCheck();

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/health`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Org-Id': 'org-456',
          }),
        })
      );
    });

    it('should set access token', async () => {
      client.setAccessToken('new-token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });

      await client.healthCheck();

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/health`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer new-token',
          }),
        })
      );
    });

    it('should set API key', async () => {
      client.setApiKey('new-api-key');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' }),
      });

      await client.healthCheck();

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/health`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'new-api-key',
          }),
        })
      );
    });
  });
});


