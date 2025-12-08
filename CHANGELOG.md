# Changelog

All notable changes to ForgeStack will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.0] - 2025-12-08

### Added

#### AI Integration (Vercel AI SDK)
- Added AI chat endpoint with streaming support (`POST /ai/chat`)
- Added text generation endpoint (`POST /ai/generate`)
- Added structured object generation (`POST /ai/generate-object`)
- Added AI usage tracking and statistics (`GET /ai/usage`)
- Added per-org AI rate limiting with Redis
- Added `useAiChat` hook for frontend streaming
- Added AI Chat page at `/ai`
- Added background AI task handler for async processing
- Added OpenAI and Anthropic provider support

#### User Impersonation
- Added impersonation session management for super-admins
- Added impersonation banner component with countdown timer
- Added `useImpersonation` hook for session status
- Added audit logging for all impersonation actions
- Added automatic session timeout

#### React Email Templates (`@forgestack/emails`)
- Created new `packages/emails` package with React Email
- Added 6 email templates: Welcome, Invitation, PasswordReset, Notification, SubscriptionConfirmed, PaymentFailed
- Added shared email components (Header, Footer, Button)
- Updated worker handlers to use new email templates

#### Comprehensive E2E Test Suite
- Added 14 Playwright E2E test files with 293+ tests
- Added `authenticatedPage` fixture for authenticated tests
- Added tests for all major user journeys:
  - Authentication (login, signup, logout)
  - Dashboard and navigation
  - Organizations (create, switch, members)
  - Projects (CRUD operations)
  - Settings (profile, API keys, webhooks, billing)
  - Admin features (impersonation, audit logs)
  - AI Chat functionality
  - Notifications and activities

### Changed

- Updated worker to 14 job handlers (added `ai-task.handler`)
- Updated Docker build to include emails package
- Improved test coverage across all packages
- Enhanced CI/CD pipeline with additional test jobs

### Fixed

- Fixed strict mode violations in Playwright tests
- Fixed lint errors for unused imports across packages
- Fixed TypeScript errors in test files
- Fixed Worker Dockerfile missing emails package dependency
- Fixed email package test configuration

## [2.0.0] - 2025-11-15

### Added

#### Super Admin Panel
- Platform-wide user management (suspend, delete, view)
- Organization management (suspend, transfer ownership, delete)
- Platform audit logs for admin actions
- Dashboard with platform-wide statistics

#### Granular RBAC with Permissions
- 33 fine-grained permissions across 11 resources
- Custom role creation per organization
- `@RequirePermission` decorator for endpoint protection
- `<PermissionGate>` component and `usePermission` hook
- Wildcard permission support (`*`, `resource:*`)

#### Billing & Subscriptions (Stripe)
- Stripe Checkout integration
- Customer portal for subscription management
- Usage-based billing with metered subscriptions
- Webhook handling for subscription sync
- Invoice history and management

#### File Uploads (Cloudflare R2)
- S3-compatible file storage
- Signed upload/download URLs
- Plan-based storage limits
- MIME type validation

#### API Keys
- Secure API key generation with scopes
- API key authentication for external integrations
- Usage tracking and rotation support

#### Webhooks
- Outgoing webhook delivery with retries
- Incoming Stripe webhook processing
- HMAC-SHA256 signature verification
- Delivery logs and status tracking

#### Audit Logs
- Immutable organization-scoped audit trail
- Platform-wide admin audit logs
- CSV/JSON export for compliance

#### Activity Feed
- Real-time activity timeline
- Activity aggregation and filtering
- Cursor-based pagination

#### Notifications
- In-app notification system
- Email notification delivery
- User notification preferences
- Priority-based notification handling

#### Feature Flags
- Plan-based feature gating
- Percentage-based rollouts
- Per-org overrides
- Redis caching for fast evaluation

#### Rate Limiting
- Plan-based API rate limits
- Redis-backed sliding window
- Rate limit headers in responses

#### Usage Tracking
- API call, storage, and seat metering
- Plan-based usage limits
- Historical usage analytics

#### Documentation Site
- MDX-powered documentation
- API reference
- SDK documentation
- How-to guides

#### Guided Onboarding
- Multi-step onboarding flow
- Organization creation wizard
- Plan selection
- Team invitation

#### OpenTelemetry Observability
- Distributed tracing with Tempo/Jaeger
- Pino structured logging
- Prometheus metrics
- Grafana dashboards

#### Shared UI Component Library (`@forgestack/ui`)
- 22 base components (Button, Card, Dialog, etc.)
- 4 compound components (ConfirmDialog, EmptyState, PageHeader, StatCard)
- Design tokens (colors, spacing, typography)
- Storybook documentation

### Changed

- Upgraded to Next.js 16 and React 19
- Migrated to ESLint 9 with flat config
- Enhanced TypeScript strict mode coverage
- Improved monorepo structure with Turborepo

## [1.0.0] - 2025-10-01

### Added

- Initial release with core multi-tenancy
- better-auth authentication
- PostgreSQL with Drizzle ORM
- Row-Level Security policies
- NestJS API with CRUD endpoints
- Next.js frontend with shadcn/ui
- BullMQ background job processing
- Docker Compose development environment
- Basic email integration with Resend

