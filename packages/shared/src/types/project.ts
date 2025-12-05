/**
 * Project Types
 * Base types for project entities
 */

export interface BaseProject {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
}

