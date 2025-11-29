/**
 * Organizations Controller
 * REST API endpoints for organization management
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  ParseUUIDPipe,
  Logger,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto, QueryOrganizationsDto } from './dto';
import { NoOrgRequired } from '../core/decorators/no-org-required.decorator';
import type { RequestWithUser } from '../core/types';

@Controller('organizations')
export class OrganizationsController {
  private readonly logger = new Logger(OrganizationsController.name);

  constructor(private readonly organizationsService: OrganizationsService) {}

  /**
   * Create a new organization
   * POST /organizations
   */
  @Post()
  @NoOrgRequired()
  async create(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @Req() request: RequestWithUser,
  ) {
    const userId = request.user.id;
    this.logger.log(`Creating organization for user ${userId}`);
    return this.organizationsService.create(userId, createOrganizationDto);
  }

  /**
   * List all organizations for the current user
   * GET /organizations
   */
  @Get()
  @NoOrgRequired()
  async findAll(
    @Query() query: QueryOrganizationsDto,
    @Req() request: RequestWithUser,
  ) {
    const userId = request.user.id;
    this.logger.log(`Listing organizations for user ${userId}`);
    return this.organizationsService.findAllForUser(userId, query);
  }

  /**
   * Get a specific organization
   * GET /organizations/:id
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ) {
    const userId = request.tenantContext?.userId || request.user.id;
    return this.organizationsService.findOne(id, userId);
  }

  /**
   * Update an organization (OWNER only)
   * PATCH /organizations/:id
   */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
    @Req() request: RequestWithUser,
  ) {
    const userId = request.tenantContext?.userId || request.user.id;
    return this.organizationsService.update(id, userId, updateOrganizationDto);
  }

  /**
   * Delete an organization (OWNER only)
   * DELETE /organizations/:id
   */
  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ) {
    const userId = request.tenantContext?.userId || request.user.id;
    return this.organizationsService.remove(id, userId);
  }
}

