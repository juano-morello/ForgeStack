/**
 * @forgestack/db
 * Drizzle ORM database layer for ForgeStack
 *
 * This package provides:
 * - Schema definitions (users, organizations, projects, etc.)
 * - Database client with connection pooling
 * - withTenantContext() for RLS enforcement
 * - Migration utilities
 */

export const DB_VERSION = '0.0.1';

// Database client and schema
export { db, pool, schema, closePool } from './client.js';

// Re-export drizzle-orm operators to avoid version conflicts in consumers
export { eq, and, or, sql, desc, asc, ilike, like, count, inArray, gt, lt, gte, lte, isNull, isNotNull } from 'drizzle-orm';

// Tenant context utilities
export { withTenantContext, withServiceContext } from './context.js';

// Context types (use these for RLS)
export type {
  TenantContext,
  ServiceContext,
  DatabaseContext,
} from './types/index.js';
export { isServiceContext, isTenantContext } from './types/index.js';

// Schema types (use OrgRole from schema, not types)
export {
  // Tables
  users,
  usersRelations,
  sessions,
  sessionsRelations,
  accounts,
  accountsRelations,
  verifications,
  organizations,
  organizationsRelations,
  organizationMembers,
  organizationMembersRelations,
  orgRoleEnum,
  projects,
  projectsRelations,
  invitations,
  invitationsRelations,
  customers,
  customersRelations,
  subscriptions,
  subscriptionsRelations,
  billingEvents,
  billingEventsRelations,
  files,
  filesRelations,
  apiKeys,
  apiKeysRelations,
  webhookEndpoints,
  webhookEndpointsRelations,
  webhookDeliveries,
  webhookDeliveriesRelations,
  incomingWebhookEvents,
  incomingWebhookEventsRelations,
  auditLogs,
  auditLogsRelations,
  activities,
  activitiesRelations,
  notifications,
  notificationsRelations,
  notificationPreferences,
  notificationPreferencesRelations,
  featureFlags,
  featureFlagsRelations,
  organizationFeatureOverrides,
  organizationFeatureOverridesRelations,
  roles,
  rolesRelations,
  permissions,
  permissionsRelations,
  rolePermissions,
  rolePermissionsRelations,
  memberRoles,
  memberRolesRelations,
  platformAuditLogs,
  platformAuditLogsRelations,
  usageRecords,
  usageRecordsRelations,
  usageLimits,
  usageLimitsRelations,
  plans,
  impersonationSessions,
  impersonationSessionsRelations,
  aiUsage,
  aiUsageRelations,
} from './schema/index.js';

// Schema type exports
export type {
  User,
  NewUser,
  Organization,
  NewOrganization,
  OrganizationMember,
  NewOrganizationMember,
  OrgRole,
  Project,
  NewProject,
  Invitation,
  NewInvitation,
  Customer,
  NewCustomer,
  Subscription,
  NewSubscription,
  BillingEvent,
  NewBillingEvent,
  File,
  NewFile,
  ApiKey,
  NewApiKey,
  WebhookEndpoint,
  NewWebhookEndpoint,
  WebhookDelivery,
  NewWebhookDelivery,
  IncomingWebhookEvent,
  NewIncomingWebhookEvent,
  AuditLog,
  NewAuditLog,
  Activity,
  NewActivity,
  Notification,
  NewNotification,
  NotificationPreference,
  NewNotificationPreference,
  FeatureFlag,
  NewFeatureFlag,
  OrganizationFeatureOverride,
  NewOrganizationFeatureOverride,
  Role,
  NewRole,
  Permission,
  NewPermission,
  RolePermission,
  NewRolePermission,
  MemberRole,
  NewMemberRole,
  PlatformAuditLog,
  NewPlatformAuditLog,
  UsageRecord,
  NewUsageRecord,
  UsageLimit,
  NewUsageLimit,
  Plan,
  NewPlan,
  ImpersonationSession,
  NewImpersonationSession,
  AiUsage,
  NewAiUsage,
} from './schema/index.js';

