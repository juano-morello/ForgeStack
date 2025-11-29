/**
 * Core module
 * Provides shared guards, decorators, filters, and interceptors
 */

import { Module, Global, forwardRef } from '@nestjs/common';
import { TenantContextGuard } from './guards/tenant-context.guard';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { OrganizationsModule } from '../organizations/organizations.module';

@Global()
@Module({
  imports: [forwardRef(() => OrganizationsModule)],
  providers: [TenantContextGuard, LoggingInterceptor],
  exports: [TenantContextGuard, LoggingInterceptor],
})
export class CoreModule {}

