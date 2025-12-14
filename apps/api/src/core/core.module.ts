/**
 * Core module
 * Provides shared guards, decorators, filters, and interceptors
 */

import { Module, Global, forwardRef, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TenantContextGuard } from './guards/tenant-context.guard';
import { RequireRoleGuard } from './guards/require-role.guard';
import { PermissionGuard } from './guards/permission.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { RequestIdMiddleware } from './middleware/request-id.middleware';
import { OrganizationsModule } from '../organizations/organizations.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Global()
@Module({
  imports: [forwardRef(() => OrganizationsModule), PermissionsModule],
  providers: [
    TenantContextGuard,
    LoggingInterceptor,
    RequestIdMiddleware,
    {
      provide: APP_GUARD,
      useClass: SuperAdminGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RequireRoleGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
  exports: [TenantContextGuard, LoggingInterceptor],
})
export class CoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}

