/**
 * Projects Service
 * Handles business logic for project operations
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { type TenantContext } from '@forgestack/db';
import { CreateProjectDto, UpdateProjectDto, QueryProjectsDto } from './dto';
import { ProjectsRepository } from './projects.repository';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly projectsRepository: ProjectsRepository) {}

  /**
   * Create a new project
   */
  async create(ctx: TenantContext, dto: CreateProjectDto) {
    this.logger.log(`Creating project "${dto.name}" in org ${ctx.orgId}`);

    const result = await this.projectsRepository.create(ctx, {
      name: dto.name,
      description: dto.description,
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

    const result = await this.projectsRepository.update(ctx, id, {
      name: dto.name,
      description: dto.description,
    });

    if (!result) {
      throw new NotFoundException('Project not found');
    }

    this.logger.log(`Project ${id} updated`);
    return result;
  }

  /**
   * Delete a project (OWNER only)
   */
  async remove(ctx: TenantContext, id: string) {
    this.logger.log(`Deleting project ${id} in org ${ctx.orgId}`);

    // Check if user is OWNER
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only owners can delete projects');
    }

    const result = await this.projectsRepository.delete(ctx, id);
    if (!result) {
      throw new NotFoundException('Project not found');
    }

    this.logger.log(`Project ${id} deleted`);
    return { deleted: true };
  }
}

