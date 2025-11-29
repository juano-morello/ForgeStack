'use client';

/**
 * useProjects Hook
 *
 * Hook for managing project state including fetching, creating,
 * updating, and deleting projects within the current organization.
 */

import { useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import type {
  Project,
  ProjectsResponse,
  CreateProjectDto,
  UpdateProjectDto,
} from '@/types/project';

interface UseProjectsOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all projects for the current org
  const fetchProjects = useCallback(
    async (options: UseProjectsOptions = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (options.page) queryParams.set('page', String(options.page));
        if (options.limit) queryParams.set('limit', String(options.limit));
        if (options.search) queryParams.set('search', options.search);

        const queryString = queryParams.toString();
        const endpoint = `/projects${queryString ? `?${queryString}` : ''}`;

        const data = await api.get<ProjectsResponse>(endpoint);
        setProjects(data.items);
        setTotal(data.total);
        setPage(data.page);
        setLimit(data.limit);
        return data;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to fetch projects';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Get a single project by ID
  const getProject = useCallback(async (id: string): Promise<Project> => {
    const project = await api.get<Project>(`/projects/${id}`);
    return project;
  }, []);

  // Create a new project
  const createProject = useCallback(
    async (dto: CreateProjectDto): Promise<Project> => {
      const project = await api.post<Project>('/projects', dto);
      setProjects((prev) => [project, ...prev]);
      setTotal((prev) => prev + 1);
      return project;
    },
    []
  );

  // Update an existing project
  const updateProject = useCallback(
    async (id: string, dto: UpdateProjectDto): Promise<Project> => {
      const project = await api.patch<Project>(`/projects/${id}`, dto);
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? project : p))
      );
      return project;
    },
    []
  );

  // Delete a project
  const deleteProject = useCallback(
    async (id: string): Promise<void> => {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setTotal((prev) => prev - 1);
    },
    []
  );

  return {
    projects,
    total,
    page,
    limit,
    isLoading,
    error,
    fetchProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
  };
}

