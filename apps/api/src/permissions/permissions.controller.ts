/**
 * Permissions Controller
 * REST API endpoints for permission operations
 */

import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { RequirePermission } from '../core/decorators/require-permission.decorator';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  private readonly logger = new Logger(PermissionsController.name);

  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * GET /permissions
   * List all permissions (requires roles:read permission)
   */
  @Get()
  @ApiOperation({
    summary: 'List all permissions',
    description: 'Get all available permissions grouped by resource type'
  })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires roles:read permission' })
  @RequirePermission('roles:read')
  async findAll() {
    this.logger.debug('GET /permissions');
    return this.permissionsService.listAllGrouped();
  }
}

