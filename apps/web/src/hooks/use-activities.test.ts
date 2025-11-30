import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useActivities, useRecentActivities } from './use-activities';
import * as activitiesApi from '@/lib/api/activities';
import type { Activity, ActivitiesResponse } from '@/types/activities';

// Mock the API
vi.mock('@/lib/api/activities');

describe('useActivities', () => {
  const mockOrgId = 'org-123';
  const mockActivities: Activity[] = [
    {
      id: '1',
      orgId: mockOrgId,
      actorId: 'user-1',
      actorName: 'John Doe',
      actorAvatar: null,
      type: 'project.created',
      title: 'created project Test Project',
      description: null,
      resourceType: 'project',
      resourceId: 'project-1',
      resourceName: 'Test Project',
      metadata: null,
      aggregationCount: 1,
      createdAt: new Date().toISOString(),
    },
  ];

  const mockResponse: ActivitiesResponse = {
    data: mockActivities,
    nextCursor: 'cursor-123',
    hasMore: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches activities on mount when autoFetch is true', async () => {
    vi.spyOn(activitiesApi, 'listActivities').mockResolvedValue(mockResponse);

    const { result } = renderHook(() =>
      useActivities({ orgId: mockOrgId, autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(activitiesApi.listActivities).toHaveBeenCalledWith(mockOrgId, undefined);
    expect(result.current.activities).toEqual(mockActivities);
    expect(result.current.hasMore).toBe(true);
  });

  it('does not fetch activities when autoFetch is false', () => {
    vi.spyOn(activitiesApi, 'listActivities').mockResolvedValue(mockResponse);

    renderHook(() =>
      useActivities({ orgId: mockOrgId, autoFetch: false })
    );

    expect(activitiesApi.listActivities).not.toHaveBeenCalled();
  });

  it('handles fetch error', async () => {
    const error = new Error('Failed to fetch');
    vi.spyOn(activitiesApi, 'listActivities').mockRejectedValue(error);

    const { result } = renderHook(() =>
      useActivities({ orgId: mockOrgId, autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch activities');
    expect(result.current.activities).toEqual([]);
  });

  it('applies filters when fetching', async () => {
    vi.spyOn(activitiesApi, 'listActivities').mockResolvedValue(mockResponse);

    const filters = { type: 'project.created' };
    renderHook(() =>
      useActivities({ orgId: mockOrgId, filters, autoFetch: true })
    );

    await waitFor(() => {
      expect(activitiesApi.listActivities).toHaveBeenCalledWith(mockOrgId, filters);
    });
  });
});

describe('useRecentActivities', () => {
  const mockOrgId = 'org-123';
  const mockActivities: Activity[] = [
    {
      id: '1',
      orgId: mockOrgId,
      actorId: 'user-1',
      actorName: 'John Doe',
      actorAvatar: null,
      type: 'project.created',
      title: 'created project Test Project',
      description: null,
      resourceType: 'project',
      resourceId: 'project-1',
      resourceName: 'Test Project',
      metadata: null,
      aggregationCount: 1,
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches recent activities on mount', async () => {
    vi.spyOn(activitiesApi, 'getRecentActivities').mockResolvedValue(mockActivities);

    const { result } = renderHook(() =>
      useRecentActivities({ orgId: mockOrgId, limit: 5, autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(activitiesApi.getRecentActivities).toHaveBeenCalledWith(mockOrgId, 5);
    expect(result.current.activities).toEqual(mockActivities);
  });

  it('does not fetch when autoFetch is false', () => {
    vi.spyOn(activitiesApi, 'getRecentActivities').mockResolvedValue(mockActivities);

    renderHook(() =>
      useRecentActivities({ orgId: mockOrgId, autoFetch: false })
    );

    expect(activitiesApi.getRecentActivities).not.toHaveBeenCalled();
  });

  it('handles fetch error', async () => {
    const error = new Error('Failed to fetch');
    vi.spyOn(activitiesApi, 'getRecentActivities').mockRejectedValue(error);

    const { result } = renderHook(() =>
      useRecentActivities({ orgId: mockOrgId, autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch recent activities');
    expect(result.current.activities).toEqual([]);
  });
});

