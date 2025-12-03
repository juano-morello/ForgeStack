/**
 * Roles Service
 * Handles business logic for role operations
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { RolesRepository } from './roles.repository';
import { PermissionsRepository } from '../permissions/permissions.repository';
import { CreateRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    private readonly rolesRepository: RolesRepository,
    private readonly permissionsRepository: PermissionsRepository,
  ) {}

  /**
   * Create a custom role
   */
  async create(orgId: string, dto: CreateRoleDto) {
    this.logger.log(`Creating role ${dto.name} for org ${orgId}`);

    // Validate permissions exist
    const perms = await this.permissionsRepository.findByNames([]);
    const validPermissionIds = new Set(perms.map((p) => p.id));
    for (const permId of dto.permissionIds) {
      if (!validPermissionIds.has(permId)) {
        throw new BadRequestException(`Invalid permission ID: ${permId}`);
      }
    }

    return this.rolesRepository.create(
      {
        orgId,
        name: dto.name,
        description: dto.description,
      },
      dto.permissionIds,
    );
  }

  /**
   * Find all roles for an organization
   */
  async findAllForOrg(orgId: string) {
    this.logger.debug(`Finding all roles for org ${orgId}`);
    return this.rolesRepository.findAllForOrg(orgId);
  }

  /**
   * Find a single role by ID
   */
  async findOne(orgId: string, roleId: string) {
    this.logger.debug(`Finding role ${roleId}`);

    const role = await this.rolesRepository.findOne(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Verify role belongs to org or is a system role
    if (role.orgId && role.orgId !== orgId) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  /**
   * Update a role
   */
  async update(orgId: string, roleId: string, dto: UpdateRoleDto) {
    this.logger.log(`Updating role ${roleId}`);

    const role = await this.findOne(orgId, roleId);

    if (role.isSystem) {
      throw new ForbiddenException('Cannot modify system roles');
    }

    // Validate permissions if provided
    if (dto.permissionIds) {
      const perms = await this.permissionsRepository.findByNames([]);
      const validPermissionIds = new Set(perms.map((p) => p.id));
      for (const permId of dto.permissionIds) {
        if (!validPermissionIds.has(permId)) {
          throw new BadRequestException(`Invalid permission ID: ${permId}`);
        }
      }
    }

    return this.rolesRepository.update(
      roleId,
      {
        name: dto.name,
        description: dto.description,
      },
      dto.permissionIds,
    );
  }

  /**
   * Delete a role
   */
  async delete(orgId: string, roleId: string): Promise<void> {
    this.logger.log(`Deleting role ${roleId}`);

    const role = await this.findOne(orgId, roleId);

    if (role.isSystem) {
      throw new ForbiddenException('Cannot delete system roles');
    }

    // Check if role has members
    const memberCount = await this.rolesRepository.getMemberCount(roleId);
    if (memberCount > 0) {
      throw new BadRequestException(
        'Cannot delete role with assigned members. Reassign members first.',
      );
    }

    await this.rolesRepository.delete(roleId);
  }

  /**
   * Get member's roles
   */
  async getMemberRoles(orgId: string, userId: string) {
    this.logger.debug(`Getting roles for user ${userId} in org ${orgId}`);
    return this.rolesRepository.getMemberRoles(orgId, userId);
  }

  /**
   * Assign roles to a member
   */
  async assignRolesToMember(
    orgId: string,
    userId: string,
    roleIds: string[],
    currentUserId: string,
  ): Promise<void> {
    this.logger.log(`Assigning roles to user ${userId} in org ${orgId}`);

    if (roleIds.length === 0) {
      throw new BadRequestException('Member must have at least one role');
    }

    // Validate all roles exist and belong to org or are system roles
    for (const roleId of roleIds) {
      await this.findOne(orgId, roleId);
    }

    // Prevent removing Owner role from self
    if (userId === currentUserId) {
      const ownerRole = await this.rolesRepository.findSystemRole('Owner');
      if (!ownerRole) {
        throw new Error('Owner system role not found');
      }

      const currentRoles = await this.rolesRepository.getMemberRoles(orgId, userId);
      const hasOwnerNow = currentRoles.some((r) => r.id === ownerRole.id);
      const willHaveOwner = roleIds.includes(ownerRole.id);

      if (hasOwnerNow && !willHaveOwner) {
        throw new ForbiddenException('Cannot remove Owner role from yourself');
      }
    }

    await this.rolesRepository.assignRolesToMember(orgId, userId, roleIds);
  }
}

