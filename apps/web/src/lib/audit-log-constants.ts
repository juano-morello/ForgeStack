/**
 * Audit Log Constants
 *
 * Constants for audit log actions, resource types, and icons.
 */

export const AUDIT_ACTIONS = {
  // Authentication
  'user.login': 'User Login',
  'user.logout': 'User Logout',
  'user.login_failed': 'Login Failed',
  'user.password_changed': 'Password Changed',
  'user.mfa_enabled': 'MFA Enabled',
  'user.mfa_disabled': 'MFA Disabled',
  
  // Members
  'member.invited': 'Member Invited',
  'member.joined': 'Member Joined',
  'member.removed': 'Member Removed',
  'member.role_changed': 'Role Changed',
  
  // Projects
  'project.created': 'Project Created',
  'project.updated': 'Project Updated',
  'project.deleted': 'Project Deleted',
  
  // API Keys
  'api_key.created': 'API Key Created',
  'api_key.revoked': 'API Key Revoked',
  'api_key.rotated': 'API Key Rotated',
  
  // Webhooks
  'webhook_endpoint.created': 'Webhook Created',
  'webhook_endpoint.updated': 'Webhook Updated',
  'webhook_endpoint.deleted': 'Webhook Deleted',
  
  // Files
  'file.uploaded': 'File Uploaded',
  'file.deleted': 'File Deleted',
  
  // Settings
  'settings.updated': 'Settings Updated',
  'billing.plan_changed': 'Plan Changed',
  'billing.payment_method_updated': 'Payment Method Updated',
} as const;

export const RESOURCE_TYPES = {
  user: 'User',
  member: 'Member',
  project: 'Project',
  api_key: 'API Key',
  webhook_endpoint: 'Webhook',
  webhook: 'Webhook',
  file: 'File',
  settings: 'Settings',
  billing: 'Billing',
  auth: 'Authentication',
} as const;

export const ACTION_ICONS: Record<string, string> = {
  // Generic actions
  created: 'plus',
  updated: 'edit',
  deleted: 'trash',
  
  // Member actions
  invited: 'user-plus',
  joined: 'user-check',
  removed: 'user-minus',
  role_changed: 'shield',
  
  // Auth actions
  login: 'log-in',
  logout: 'log-out',
  login_failed: 'alert-circle',
  password_changed: 'key',
  mfa_enabled: 'shield-check',
  mfa_disabled: 'shield-off',
  
  // File actions
  uploaded: 'upload',
  
  // API Key actions
  revoked: 'x-circle',
  rotated: 'rotate-cw',
  
  // Billing actions
  plan_changed: 'credit-card',
  payment_method_updated: 'credit-card',
};

/**
 * Get a human-readable label for an action
 */
export function getActionLabel(action: string): string {
  return AUDIT_ACTIONS[action as keyof typeof AUDIT_ACTIONS] || action;
}

/**
 * Get a human-readable label for a resource type
 */
export function getResourceTypeLabel(resourceType: string): string {
  return RESOURCE_TYPES[resourceType as keyof typeof RESOURCE_TYPES] || resourceType;
}

/**
 * Get the icon name for an action
 */
export function getActionIcon(action: string): string {
  // Try to match the full action first (e.g., "user.login")
  if (ACTION_ICONS[action]) {
    return ACTION_ICONS[action];
  }
  
  // Try to match the action verb (e.g., "created" from "project.created")
  const verb = action.split('.').pop() || '';
  return ACTION_ICONS[verb] || 'activity';
}

/**
 * Get color variant for action badge
 */
export function getActionVariant(action: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const verb = action.split('.').pop() || '';
  
  if (verb === 'created' || verb === 'joined' || verb === 'enabled') {
    return 'default'; // Green/primary
  }
  
  if (verb === 'deleted' || verb === 'removed' || verb === 'revoked' || verb === 'failed') {
    return 'destructive'; // Red
  }
  
  if (verb === 'updated' || verb === 'changed' || verb === 'rotated') {
    return 'secondary'; // Blue/secondary
  }
  
  return 'outline'; // Default
}

