/**
 * Projects Service
 * Handles business logic for project operations
 */

import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { type TenantContext } from '@forgestack/db';
import { CreateProjectDto, UpdateProjectDto, QueryProjectsDto } from './dto';
import { ProjectsRepository } from './projects.repository';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  /**
   * Create a new project
   */
  async create(ctx: TenantContext, dto: CreateProjectDto) {
    this.logger.log(`Creating project "${dto.name}" in org ${ctx.orgId}`);

    const result = await this.projectsRepository.create(ctx, {
      name: dto.name,
      description: dto.description,
    });

    // Log audit event
    await this.auditLogsService.log(
      {
        orgId: ctx.orgId,
        actorId: ctx.userId,
        actorType: 'user',
      },
      {
        action: 'project.created',
        resourceType: 'project',
        resourceId: result.id,
        resourceName: result.name,
        metadata: {
          description: result.description,
        },
      },
    );

    // Create activity (async, non-blocking)
    await this.activitiesService.create({
      orgId: ctx.orgId,
      actorId: ctx.userId,
      type: 'project.created',
      title: `created project "${result.name}"`,
      resourceType: 'project',
      resourceId: result.id,
      resourceName: result.name,
    });

    this.logger.log(`Project created: ${result.id}`);
    return result;
  }

  /**
   * Get all projects for the current org with pagination and search
   */
  async findAll(ctx: TenantContext, query: QueryProjectsDto) {
    this.logger.debug(`Finding all projects for org ${ctx.orgId}`);

    return this.projectsRepository.findAll(ctx, {
      search: query.search,
      page: query.page,
      limit: query.limit,
    });
  }

  /**
   * Get a single project by ID
   */
  async findOne(ctx: TenantContext, id: string) {
    this.logger.debug(`Finding project ${id} in org ${ctx.orgId}`);

    const result = await this.projectsRepository.findById(ctx, id);
    if (!result) {
      throw new NotFoundException('Project not found');
    }

    return result;
  }

  /**
   * Update a project
   */
  async update(ctx: TenantContext, id: string, dto: UpdateProjectDto) {
    this.logger.log(`Updating project ${id} in org ${ctx.orgId}`);

    // Get existing project for changes tracking
    const before = await this.projectsRepository.findById(ctx, id);
    if (!before) {
      throw new NotFoundException('Project not found');
    }

    const result = await this.projectsRepository.update(ctx, id, {
      name: dto.name,
      description: dto.description,
    });

    if (!result) {
      throw new NotFoundException('Project not found');
    }

    // Log audit event with changes
    await this.auditLogsService.log(
      {
        orgId: ctx.orgId,
        actorId: ctx.userId,
        actorType: 'user',
      },
      {
        action: 'project.updated',
        resourceType: 'project',
        resourceId: result.id,
        resourceName: result.name,
        changes: {
          before: {
            name: before.name,
            description: before.description,
          },
          after: {
            name: result.name,
            description: result.description,
          },
        },
      },
    );

    // Create activity (async, non-blocking)
    await this.activitiesService.create({
      orgId: ctx.orgId,
      actorId: ctx.userId,
      type: 'project.updated',
      title: `updated project "${result.name}"`,
      resourceType: 'project',
      resourceId: result.id,
      resourceName: result.name,
    });

    this.logger.log(`Project ${id} updated`);
    return result;
  }

  /**
   * Delete a project (OWNER only)
   */
  async remove(ctx: TenantContext, id: string) {
    this.logger.log(`Deleting project ${id} in org ${ctx.orgId}`);

    // Get project details before deletion
    const project = await this.projectsRepository.findById(ctx, id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const result = await this.projectsRepository.delete(ctx, id);
    if (!result) {
      throw new NotFoundException('Project not found');
    }

    // Log audit event
    await this.auditLogsService.log(
      {
        orgId: ctx.orgId,
        actorId: ctx.userId,
        actorType: 'user',
      },
      {
        action: 'project.deleted',
        resourceType: 'project',
        resourceId: id,
        resourceName: project.name,
      },
    );

    // Create activity (async, non-blocking)
    await this.activitiesService.create({
      orgId: ctx.orgId,
      actorId: ctx.userId,
      type: 'project.deleted',
      title: `deleted project "${project.name}"`,
      resourceType: 'project',
      resourceId: id,
      resourceName: project.name,
    });

    this.logger.log(`Project ${id} deleted`);
    return { deleted: true };
  }
}

