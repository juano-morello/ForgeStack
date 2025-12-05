/**
 * Project Types
 *
 * Extended type definitions for project-related data structures.
 * Base types imported from @forgestack/shared
 */

// Re-export base types from shared
export type { BaseProject, CreateProjectInput, UpdateProjectInput } from '@forgestack/shared/browser';

// Alias for backward compatibility
import type { BaseProject } from '@forgestack/shared/browser';
export type Project = BaseProject;

// Web-specific response types
export interface ProjectsResponse {
  items: Project[];
  total: number;
  page: number;
  limit: number;
}

// Backward compatibility aliases
export type CreateProjectDto = { name: string; description?: string };
export type UpdateProjectDto = { name?: string; description?: string };

