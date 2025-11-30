/**
 * Schema barrel export
 * All Drizzle ORM table definitions and relations
 */

// Tables
export {
  users,
  usersRelations,
  sessions,
  sessionsRelations,
  accounts,
  accountsRelations,
  verifications,
} from './users';
export { organizations, organizationsRelations } from './organizations';
export {
  organizationMembers,
  organizationMembersRelations,
  orgRoleEnum,
} from './organization-members';
export { projects, projectsRelations } from './projects';
export { invitations, invitationsRelations } from './invitations';
export { customers, customersRelations } from './customers';
export { subscriptions, subscriptionsRelations } from './subscriptions';
export { billingEvents, billingEventsRelations } from './billing-events';

// Types
export type {
  User, NewUser,
  Session, NewSession,
  Account, NewAccount,
  Verification, NewVerification,
} from './users';
export type { Organization, NewOrganization } from './organizations';
export type { OrganizationMember, NewOrganizationMember, OrgRole } from './organization-members';
export type { Project, NewProject } from './projects';
export type { Invitation, NewInvitation } from './invitations';
export type { Customer, NewCustomer } from './customers';
export type { Subscription, NewSubscription } from './subscriptions';
export type { BillingEvent, NewBillingEvent } from './billing-events';

