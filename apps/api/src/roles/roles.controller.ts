/**
 * Roles Controller
 * REST API endpoints for role management
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { PermissionsRepository } from '../permissions/permissions.repository';
import { CreateRoleDto, UpdateRoleDto, AssignRolesDto } from './dto';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import { RequirePermission } from '../core/decorators/require-permission.decorator';
import type { TenantContext } from '@forgestack/db';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  private readonly logger = new Logger(RolesController.name);

  constructor(
    private readonly rolesService: RolesService,
    private readonly permissionsRepository: PermissionsRepository,
  ) {}

  /**
   * GET /roles
   * List all roles (system + custom)
   */
  @Get()
  @ApiOperation({
    summary: 'List roles',
    description: 'Get all roles (system and custom) for the organization'
  })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires roles:read permission' })
  @RequirePermission('roles:read')
  async findAll(@CurrentTenant() ctx: TenantContext) {
    this.logger.debug(`GET /roles for org ${ctx.orgId}`);
    return this.rolesService.findAllForOrg(ctx.orgId);
  }

  /**
   * POST /roles
   * Create a custom role
   */
  @Post()
  @ApiOperation({
    summary: 'Create role',
    description: 'Create a custom role with specified permissions'
  })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires roles:create permission' })
  @RequirePermission('roles:create')
  async create(@CurrentTenant() ctx: TenantContext, @Body() dto: CreateRoleDto) {
    this.logger.log(`POST /roles for org ${ctx.orgId}`);
    return this.rolesService.create(ctx.orgId, dto);
  }

  /**
   * GET /roles/:id
   * Get role details
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get role details',
    description: 'Get details of a specific role by ID'
  })
  @ApiParam({ name: 'id', description: 'Role ID', type: String })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires roles:read permission' })
  @RequirePermission('roles:read')
  async findOne(
    @CurrentTenant() ctx: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    this.logger.debug(`GET /roles/${id} for org ${ctx.orgId}`);
    return this.rolesService.findOne(ctx.orgId, id);
  }

  /**
   * PUT /roles/:id
   * Update a role
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update role',
    description: 'Update a custom role (cannot update system roles)'
  })
  @ApiParam({ name: 'id', description: 'Role ID', type: String })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or cannot update system role' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires roles:update permission' })
  @RequirePermission('roles:update')
  async update(
    @CurrentTenant() ctx: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    this.logger.log(`PUT /roles/${id} for org ${ctx.orgId}`);
    return this.rolesService.update(ctx.orgId, id, dto);
  }

  /**
   * DELETE /roles/:id
   * Delete a role
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete role',
    description: 'Delete a custom role (cannot delete system roles)'
  })
  @ApiParam({ name: 'id', description: 'Role ID', type: String })
  @ApiResponse({ status: 204, description: 'Role deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete system role' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires roles:delete permission' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('roles:delete')
  async remove(
    @CurrentTenant() ctx: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    this.logger.log(`DELETE /roles/${id} for org ${ctx.orgId}`);
    await this.rolesService.delete(ctx.orgId, id);
  }

}

@ApiTags('Members')
@ApiBearerAuth()
@Controller('members')
export class MemberRolesController {
  private readonly logger = new Logger(MemberRolesController.name);

  constructor(
    private readonly rolesService: RolesService,
    private readonly permissionsRepository: PermissionsRepository,
  ) {}

  /**
   * GET /members/:userId/roles
   * Get member's roles
   */
  @Get(':userId/roles')
  @ApiOperation({
    summary: 'Get member roles',
    description: 'Get roles and effective permissions for a member'
  })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  @ApiResponse({ status: 200, description: 'Member roles retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires members:read permission' })
  @RequirePermission('members:read')
  async getMemberRoles(
    @CurrentTenant() ctx: TenantContext,
    @Param('userId') userId: string,
  ) {
    this.logger.debug(`GET /members/${userId}/roles for org ${ctx.orgId}`);
    const roles = await this.rolesService.getMemberRoles(ctx.orgId, userId);

    // Get effective permissions
    const effectivePermissions = await this.permissionsRepository.getEffectivePermissions(
      ctx.orgId,
      userId,
    );

    return {
      userId,
      roles,
      effectivePermissions,
    };
  }

  /**
   * PUT /members/:userId/roles
   * Assign roles to a member
   */
  @Put(':userId/roles')
  @ApiOperation({
    summary: 'Assign roles to member',
    description: 'Assign one or more roles to a member'
  })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  @ApiResponse({ status: 200, description: 'Roles assigned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires members:update permission' })
  @RequirePermission('members:update')
  async assignRoles(
    @CurrentTenant() ctx: TenantContext,
    @Param('userId') userId: string,
    @Body() dto: AssignRolesDto,
  ) {
    this.logger.log(`PUT /members/${userId}/roles for org ${ctx.orgId}`);
    await this.rolesService.assignRolesToMember(
      ctx.orgId,
      userId,
      dto.roleIds,
      ctx.userId,
    );

    const roles = await this.rolesService.getMemberRoles(ctx.orgId, userId);
    return {
      userId,
      roles,
    };
  }
}

