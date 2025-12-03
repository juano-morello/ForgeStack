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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto, QueryOrganizationsDto } from './dto';
import { NoOrgRequired } from '../core/decorators/no-org-required.decorator';
import type { RequestWithUser } from '../core/types';

@ApiTags('Organizations')
@ApiBearerAuth()
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
  @ApiOperation({ summary: 'Create organization', description: 'Create a new organization for the current user' })
  @ApiResponse({ status: 201, description: 'Organization created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'List organizations', description: 'Get all organizations for the current user' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'List of organizations' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Get organization', description: 'Get a specific organization by ID' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiResponse({ status: 200, description: 'Organization found' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Update organization', description: 'Update an organization (OWNER only)' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiResponse({ status: 200, description: 'Organization updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - OWNER role required' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
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
  @ApiOperation({ summary: 'Delete organization', description: 'Delete an organization (OWNER only)' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiResponse({ status: 200, description: 'Organization deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - OWNER role required' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: RequestWithUser,
  ) {
    const userId = request.tenantContext?.userId || request.user.id;
    return this.organizationsService.remove(id, userId);
  }
}

