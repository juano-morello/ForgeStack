/**
 * ForgeStack API Client
 */

import type {
  Organization,
  Project,
  ApiKey,
  ApiKeyCreated,
  DashboardSummary,
  PaginatedResponse,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
  QueryParams,
} from './types';

export interface ForgeStackConfig {
  baseUrl: string;
  apiKey?: string;
  accessToken?: string;
  orgId?: string;
  onError?: (error: Error) => void;
}

export class ForgeStackClient {
  private config: ForgeStackConfig;

  constructor(config: ForgeStackConfig) {
    this.config = config;
  }

  private async request<T>(
    method: string,
    path: string,
    options?: { body?: unknown; query?: Record<string, string> }
  ): Promise<T> {
    const url = new URL(path, this.config.baseUrl);

    if (options?.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        if (value !== undefined) url.searchParams.set(key, value);
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.accessToken) {
      headers['Authorization'] = `Bearer ${this.config.accessToken}`;
    }
    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    }
    if (this.config.orgId) {
      headers['X-Org-Id'] = this.config.orgId;
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = new Error(`API Error: ${response.status} ${response.statusText}`);
      this.config.onError?.(error);
      throw error;
    }

    return response.json();
  }

  // Organizations
  async listOrganizations(params?: QueryParams) {
    return this.request<PaginatedResponse<Organization>>('GET', '/organizations', {
      query: params as Record<string, string>,
    });
  }

  async createOrganization(data: CreateOrganizationRequest) {
    return this.request<Organization>('POST', '/organizations', { body: data });
  }

  async getOrganization(id: string) {
    return this.request<Organization>('GET', `/organizations/${id}`);
  }

  async updateOrganization(id: string, data: UpdateOrganizationRequest) {
    return this.request<Organization>('PATCH', `/organizations/${id}`, { body: data });
  }

  async deleteOrganization(id: string) {
    return this.request<void>('DELETE', `/organizations/${id}`);
  }

  // Projects
  async listProjects(params?: QueryParams) {
    return this.request<PaginatedResponse<Project>>('GET', '/projects', {
      query: params as Record<string, string>,
    });
  }

  async createProject(data: CreateProjectRequest) {
    return this.request<Project>('POST', '/projects', { body: data });
  }

  async getProject(id: string) {
    return this.request<Project>('GET', `/projects/${id}`);
  }

  async updateProject(id: string, data: UpdateProjectRequest) {
    return this.request<Project>('PATCH', `/projects/${id}`, { body: data });
  }

  async deleteProject(id: string) {
    return this.request<void>('DELETE', `/projects/${id}`);
  }

  // API Keys
  async listApiKeys() {
    return this.request<PaginatedResponse<ApiKey>>('GET', '/api-keys');
  }

  async createApiKey(data: CreateApiKeyRequest) {
    return this.request<ApiKeyCreated>('POST', '/api-keys', { body: data });
  }

  async getApiKey(id: string) {
    return this.request<ApiKey>('GET', `/api-keys/${id}`);
  }

  async updateApiKey(id: string, data: UpdateApiKeyRequest) {
    return this.request<ApiKey>('PATCH', `/api-keys/${id}`, { body: data });
  }

  async revokeApiKey(id: string) {
    return this.request<void>('DELETE', `/api-keys/${id}`);
  }

  async rotateApiKey(id: string) {
    return this.request<ApiKeyCreated>('POST', `/api-keys/${id}/rotate`);
  }

  // Dashboard
  async getDashboardSummary() {
    return this.request<DashboardSummary>('GET', '/dashboard/summary');
  }

  // Health
  async healthCheck() {
    return this.request<{ status: string }>('GET', '/health');
  }

  // Context Management
  setOrganization(orgId: string) {
    this.config.orgId = orgId;
  }

  setAccessToken(token: string) {
    this.config.accessToken = token;
  }

  setApiKey(apiKey: string) {
    this.config.apiKey = apiKey;
  }
}

