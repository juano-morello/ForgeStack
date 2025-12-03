/**
 * Permissions Controller
 * REST API endpoints for permission operations
 */

import { Controller, Get, Logger } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { RequirePermission } from '../core/decorators/require-permission.decorator';

@Controller('permissions')
export class PermissionsController {
  private readonly logger = new Logger(PermissionsController.name);

  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * GET /permissions
   * List all permissions (requires roles:read permission)
   */
  @Get()
  @RequirePermission('roles:read')
  async findAll() {
    this.logger.debug('GET /permissions');
    return this.permissionsService.listAllGrouped();
  }
}

