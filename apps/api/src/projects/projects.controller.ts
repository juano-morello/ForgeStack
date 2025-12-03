/**
 * Projects Controller
 * REST API endpoints for project management
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
  ParseUUIDPipe,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import type { TenantContext } from '@forgestack/db';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto, QueryProjectsDto } from './dto';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import { RequirePermission } from '../core/decorators/require-permission.decorator';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name);

  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * Create a new project
   * POST /projects
   */
  @Post()
  @ApiOperation({ summary: 'Create project', description: 'Create a new project in the organization' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentTenant() ctx: TenantContext,
  ) {
    this.logger.log(`Creating project for org ${ctx.orgId}`);
    return this.projectsService.create(ctx, createProjectDto);
  }

  /**
   * List all projects for the current org
   * GET /projects
   */
  @Get()
  @ApiOperation({ summary: 'List projects', description: 'Get all projects for the organization' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'List of projects' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: QueryProjectsDto,
    @CurrentTenant() ctx: TenantContext,
  ) {
    this.logger.log(`Listing projects for org ${ctx.orgId}`);
    return this.projectsService.findAll(ctx, query);
  }

  /**
   * Get a specific project
   * GET /projects/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get project', description: 'Get a specific project by ID' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Project found' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() ctx: TenantContext,
  ) {
    return this.projectsService.findOne(ctx, id);
  }

  /**
   * Update a project
   * PATCH /projects/:id
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update project', description: 'Update a project' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentTenant() ctx: TenantContext,
  ) {
    return this.projectsService.update(ctx, id, updateProjectDto);
  }

  /**
   * Delete a project
   * DELETE /projects/:id
   */
  @Delete(':id')
  @RequirePermission('projects:delete')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() ctx: TenantContext,
  ) {
    return this.projectsService.remove(ctx, id);
  }
}

