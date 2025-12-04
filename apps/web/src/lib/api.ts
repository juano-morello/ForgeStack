/**
 * API Client for ForgeStack
 *
 * Handles API requests to the backend with automatic X-Org-Id header injection
 * for organization-scoped requests.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const orgId = typeof window !== 'undefined' 
    ? localStorage.getItem('currentOrgId') 
    : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (orgId) {
    (headers as Record<string, string>)['X-Org-Id'] = orgId;
  }
  
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  
  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      errorData = null;
    }
    throw new ApiError(
      errorData?.message || `API Error: ${res.status}`,
      res.status,
      errorData
    );
  }
  
  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }
  
  return res.json();
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};

// User Profile API Methods
export interface UpdateProfileDto {
  name?: string;
  image?: string;
}

export interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  image: string | null;
  updatedAt: string;
}

export interface ChangeEmailDto {
  newEmail: string;
  password: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const userApi = {
  updateProfile: (data: UpdateProfileDto) =>
    api.patch<UserProfileResponse>('/users/me/profile', data),

  requestEmailChange: (data: ChangeEmailDto) =>
    api.post<{ message: string }>('/users/me/change-email', data),

  changePassword: (data: ChangePasswordDto) =>
    api.post<{ message: string }>('/users/me/change-password', data),
};

// Organization API Methods
export interface UpdateOrganizationDto {
  name?: string;
  logo?: string;
  timezone?: string;
  language?: string;
}

export interface OrganizationResponse {
  id: string;
  name: string;
  logo: string | null;
  timezone: string | null;
  language: string | null;
  updatedAt: string;
}

export const organizationApi = {
  update: (orgId: string, data: UpdateOrganizationDto) =>
    api.patch<OrganizationResponse>(`/organizations/${orgId}`, data),
};

// Dashboard API Methods
export interface DashboardSummary {
  stats: {
    projects: number;
    members: number;
    apiKeys: number;
    storageUsedBytes: number;
  };
  recentActivity: Array<{
    id: string;
    orgId: string;
    actorId: string | null;
    actorName: string | null;
    actorAvatar: string | null;
    type: string;
    title: string;
    description: string | null;
    resourceType: string | null;
    resourceId: string | null;
    resourceName: string | null;
    metadata: Record<string, unknown> | null;
    aggregationCount: number;
    createdAt: string;
  }>;
  recentProjects: Array<{
    id: string;
    orgId: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  orgHealth?: {
    subscriptionStatus: string;
    usageSummary: {
      apiCalls: {
        current: number;
        limit: number | null;
        percentage: number;
      };
      storage: {
        current: number;
        limit: number | null;
        percentage: number;
      };
    };
  };
}

export const dashboardApi = {
  getSummary: () => api.get<DashboardSummary>('/dashboard/summary'),
};

