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
import type { TenantContext } from '@forgestack/db';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto, QueryProjectsDto } from './dto';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import { RequireRole } from '../core/decorators/require-role.decorator';

@Controller('projects')
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name);

  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * Create a new project
   * POST /projects
   */
  @Post()
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
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentTenant() ctx: TenantContext,
  ) {
    return this.projectsService.update(ctx, id, updateProjectDto);
  }

  /**
   * Delete a project (OWNER only)
   * DELETE /projects/:id
   */
  @Delete(':id')
  @RequireRole('OWNER')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() ctx: TenantContext,
  ) {
    return this.projectsService.remove(ctx, id);
  }
}

