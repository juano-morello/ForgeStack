/**
 * Projects Repository
 * Handles all database operations for projects
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  eq,
  or,
  desc,
  ilike,
  count,
  withTenantContext,
  projects,
  type TenantContext,
  type Project,
  type NewProject,
} from '@forgestack/db';
import type { PaginatedResponse, FindAllOptions } from '@forgestack/shared';

@Injectable()
export class ProjectsRepository {
  private readonly logger = new Logger(ProjectsRepository.name);

  /**
   * Create a new project within tenant context
   */
  async create(
    ctx: TenantContext,
    data: Pick<NewProject, 'name' | 'description'>,
  ): Promise<Project> {
    this.logger.debug(`Creating project "${data.name}" in org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const [project] = await tx
        .insert(projects)
        .values({
          orgId: ctx.orgId,
          name: data.name,
          description: data.description,
        })
        .returning();

      return project;
    });
  }

  /**
   * Find all projects with pagination and search within tenant context
   */
  async findAll(
    ctx: TenantContext,
    options: FindAllOptions = {},
  ): Promise<PaginatedResponse<Project>> {
    const { search, page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    this.logger.debug(
      `Finding projects in org ${ctx.orgId} (page: ${page}, limit: ${limit}, search: ${search || 'none'})`,
    );

    return withTenantContext(ctx, async (tx) => {
      // Build search condition
      const searchCondition = search
        ? or(
            ilike(projects.name, `%${search}%`),
            ilike(projects.description, `%${search}%`),
          )
        : undefined;

      // Get items with pagination
      const items = await tx
        .select()
        .from(projects)
        .where(searchCondition)
        .orderBy(desc(projects.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const [countResult] = await tx
        .select({ count: count() })
        .from(projects)
        .where(searchCondition);

      const total = Number(countResult?.count ?? 0);

      return {
        items,
        total,
        page,
        limit,
      };
    });
  }

  /**
   * Find a single project by ID within tenant context
   */
  async findById(ctx: TenantContext, id: string): Promise<Project | null> {
    this.logger.debug(`Finding project ${id} in org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const [project] = await tx
        .select()
        .from(projects)
        .where(eq(projects.id, id));
      return project || null;
    });
  }

  /**
   * Update a project within tenant context
   */
  async update(
    ctx: TenantContext,
    id: string,
    data: Partial<Pick<Project, 'name' | 'description'>>,
  ): Promise<Project | null> {
    this.logger.debug(`Updating project ${id} in org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const [project] = await tx
        .update(projects)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, id))
        .returning();
      return project || null;
    });
  }

  /**
   * Delete a project within tenant context
   */
  async delete(ctx: TenantContext, id: string): Promise<Project | null> {
    this.logger.debug(`Deleting project ${id} in org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const [deleted] = await tx
        .delete(projects)
        .where(eq(projects.id, id))
        .returning();
      return deleted || null;
    });
  }

  /**
   * Count projects in an organization within tenant context
   */
  async count(ctx: TenantContext): Promise<number> {
    this.logger.debug(`Counting projects in org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      const [result] = await tx
        .select({ count: count() })
        .from(projects);

      return Number(result?.count ?? 0);
    });
  }

  /**
   * Find recent projects within tenant context
   */
  async findRecent(ctx: TenantContext, limit = 5): Promise<Project[]> {
    this.logger.debug(`Finding ${limit} recent projects in org ${ctx.orgId}`);

    return withTenantContext(ctx, async (tx) => {
      return tx
        .select()
        .from(projects)
        .orderBy(desc(projects.updatedAt))
        .limit(limit);
    });
  }
}

