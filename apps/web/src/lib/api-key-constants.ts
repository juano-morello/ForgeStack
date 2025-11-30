/**
 * API Key Constants
 *
 * Constants for API key scopes, labels, and descriptions.
 */

import type { ApiKeyScope } from '@/types/api-keys';

export const AVAILABLE_SCOPES: ApiKeyScope[] = [
  'projects:read',
  'projects:write',
  'members:read',
  'members:write',
  'billing:read',
  'billing:write',
  'files:read',
  'files:write',
  'api-keys:read',
  'api-keys:write',
  '*',
];

export const SCOPE_LABELS: Record<ApiKeyScope, string> = {
  'projects:read': 'Read Projects',
  'projects:write': 'Write Projects',
  'members:read': 'Read Members',
  'members:write': 'Manage Members',
  'billing:read': 'Read Billing',
  'billing:write': 'Manage Billing',
  'files:read': 'Download Files',
  'files:write': 'Upload Files',
  'api-keys:read': 'Read API Keys',
  'api-keys:write': 'Manage API Keys',
  '*': 'Full Access',
};

export const SCOPE_DESCRIPTIONS: Record<ApiKeyScope, string> = {
  'projects:read': 'View projects and their details',
  'projects:write': 'Create, update, and delete projects',
  'members:read': 'View organization members',
  'members:write': 'Invite, update, and remove members',
  'billing:read': 'View billing information and subscription status',
  'billing:write': 'Manage billing settings and payment methods',
  'files:read': 'Download files from projects',
  'files:write': 'Upload files to projects',
  'api-keys:read': 'List API keys (excluding hashes)',
  'api-keys:write': 'Create, revoke, and rotate API keys',
  '*': 'Full access to all resources and operations',
};

/**
 * Get scope color variant for badges
 */
export function getScopeVariant(scope: ApiKeyScope): 'default' | 'secondary' | 'destructive' {
  if (scope === '*') return 'destructive';
  if (scope.endsWith(':write')) return 'default';
  return 'secondary';
}

/**
 * Group scopes by resource
 */
export const SCOPE_GROUPS = {
  Projects: ['projects:read', 'projects:write'] as ApiKeyScope[],
  Members: ['members:read', 'members:write'] as ApiKeyScope[],
  Billing: ['billing:read', 'billing:write'] as ApiKeyScope[],
  Files: ['files:read', 'files:write'] as ApiKeyScope[],
  'API Keys': ['api-keys:read', 'api-keys:write'] as ApiKeyScope[],
  'Full Access': ['*'] as ApiKeyScope[],
};

