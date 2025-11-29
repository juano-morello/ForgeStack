/**
 * Project Types
 *
 * Type definitions for project-related data structures.
 */

export interface Project {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsResponse {
  items: Project[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
}

