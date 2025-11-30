/**
 * Root application module
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import * as path from 'path';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
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
    AuthModule, // Must be imported before CoreModule for guard injection
    CoreModule,
    HealthModule,
    OrganizationsModule,
    ProjectsModule,
    InvitationsModule,
    MembersModule,
    QueueModule,
    BillingModule,
    FilesModule,
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

