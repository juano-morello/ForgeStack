/**
 * Organization Role Types
 * Canonical definition used across all packages
 */

export const ORG_ROLES = {
  OWNER: 'OWNER',
  MEMBER: 'MEMBER',
} as const;

export type OrgRole = (typeof ORG_ROLES)[keyof typeof ORG_ROLES];

