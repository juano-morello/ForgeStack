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
import { RolesService } from './roles.service';
import { PermissionsRepository } from '../permissions/permissions.repository';
import { CreateRoleDto, UpdateRoleDto, AssignRolesDto } from './dto';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import { RequirePermission } from '../core/decorators/require-permission.decorator';
import type { TenantContext } from '@forgestack/db';

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

