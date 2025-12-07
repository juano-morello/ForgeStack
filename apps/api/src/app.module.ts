/**
 * Root application module
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import * as path from 'path';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { TelemetryModule } from './telemetry/telemetry.module';
import { AuthModule } from './auth/auth.module';
import { CoreModule } from './core/core.module';
import { TenantContextGuard } from './core/guards/tenant-context.guard';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';
import { HealthModule } from './health/health.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ProjectsModule } from './projects/projects.module';
import { InvitationsModule } from './invitations/invitations.module';
import { MembersModule } from './members/members.module';
import { QueueModule } from './queue/queue.module';
import { BillingModule } from './billing/billing.module';
import { FilesModule } from './files/files.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { IncomingWebhooksModule } from './incoming-webhooks/incoming-webhooks.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { ActivitiesModule } from './activities/activities.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { RateLimitingModule } from './rate-limiting/rate-limiting.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { AdminModule } from './admin/admin.module';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UsageModule } from './usage/usage.module';
import { ImpersonationModule } from './impersonation/impersonation.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      envFilePath: [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '../../.env'),
      ],
    }),
    TelemetryModule, // Import early for global availability
    AuthModule, // Must be imported before CoreModule for guard injection
    CoreModule,
    RateLimitingModule, // Must be imported early for guard registration
    HealthModule,
    OrganizationsModule,
    ProjectsModule,
    InvitationsModule,
    MembersModule,
    QueueModule,
    BillingModule,
    FilesModule,
    ApiKeysModule,
    WebhooksModule,
    IncomingWebhooksModule,
    AuditLogsModule,
    ActivitiesModule,
    NotificationsModule,
    FeatureFlagsModule,
    PermissionsModule,
    RolesModule,
    AdminModule,
    ImpersonationModule,
    UsersModule,
    UsageModule,
    DashboardModule,
    AiModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: TenantContextGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}

