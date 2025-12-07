# Pattern: React Data Fetching Hooks

> How to create data fetching hooks in ForgeStack's Next.js frontend.

## Overview

ForgeStack uses custom hooks with SWR for data fetching:
- **SWR** for caching and revalidation
- **Typed API responses** from `@forgestack/shared`
- **Optimistic updates** for better UX

## Basic Hook Structure

```typescript
// apps/web/src/hooks/use-tasks.ts
import useSWR from 'swr';
import { api, fetcher } from '@/lib/api';
import type { Task, CreateTaskInput, UpdateTaskInput } from '@forgestack/shared';

export function useTasks() {
  const { data, error, isLoading, mutate } = useSWR<Task[]>(
    '/api/v1/tasks',
    fetcher
  );

  const createTask = async (input: CreateTaskInput): Promise<Task> => {
    const response = await api.post<Task>('/api/v1/tasks', input);
    mutate(); // Revalidate the list
    return response.data;
  };

  const updateTask = async (id: string, input: UpdateTaskInput): Promise<Task> => {
    const response = await api.patch<Task>(`/api/v1/tasks/${id}`, input);
    mutate(); // Revalidate the list
    return response.data;
  };

  const deleteTask = async (id: string): Promise<void> => {
    await api.delete(`/api/v1/tasks/${id}`);
    mutate(); // Revalidate the list
  };

  return {
    tasks: data ?? [],
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refresh: mutate,
  };
}
```

## Hook for Single Item

```typescript
// apps/web/src/hooks/use-task.ts
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import type { Task } from '@forgestack/shared';

export function useTask(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<Task>(
    id ? `/api/v1/tasks/${id}` : null, // null = don't fetch
    fetcher
  );

  return {
    task: data,
    isLoading,
    error,
    refresh: mutate,
  };
}
```

## Optimistic Updates

```typescript
export function useTasks() {
  const { data, mutate } = useSWR<Task[]>('/api/v1/tasks', fetcher);

  const deleteTask = async (id: string): Promise<void> => {
    // Optimistically remove from UI
    const optimisticData = data?.filter(task => task.id !== id);
    
    mutate(
      async () => {
        await api.delete(`/api/v1/tasks/${id}`);
        return optimisticData;
      },
      {
        optimisticData,
        rollbackOnError: true,
        revalidate: false,
      }
    );
  };

  // ...
}
```

## Pagination Hook

```typescript
// apps/web/src/hooks/use-tasks-paginated.ts
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import type { Task, PaginatedResponse } from '@forgestack/shared';
import { useState } from 'react';

export function useTasksPaginated(initialPage = 1, limit = 10) {
  const [page, setPage] = useState(initialPage);
  
  const { data, error, isLoading } = useSWR<PaginatedResponse<Task>>(
    `/api/v1/tasks?page=${page}&limit=${limit}`,
    fetcher
  );

  return {
    tasks: data?.items ?? [],
    total: data?.total ?? 0,
    page,
    totalPages: data ? Math.ceil(data.total / limit) : 0,
    isLoading,
    error,
    nextPage: () => setPage(p => p + 1),
    prevPage: () => setPage(p => Math.max(1, p - 1)),
    goToPage: setPage,
  };
}
```

## Conditional Fetching

```typescript
// Only fetch when user has permission
export function useTasksIfAllowed() {
  const { hasPermission } = usePermission('task', 'read');
  
  const { data, isLoading } = useSWR<Task[]>(
    hasPermission ? '/api/v1/tasks' : null,
    fetcher
  );

  return {
    tasks: data ?? [],
    isLoading: hasPermission ? isLoading : false,
    notAllowed: !hasPermission,
  };
}
```

## Hook with Filters

```typescript
// apps/web/src/hooks/use-tasks-filtered.ts
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import type { Task } from '@forgestack/shared';

interface TaskFilters {
  status?: 'todo' | 'in_progress' | 'done';
  search?: string;
}

export function useTasksFiltered(filters: TaskFilters) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  
  const queryString = params.toString();
  const url = `/api/v1/tasks${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<Task[]>(url, fetcher);

  return {
    tasks: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  };
}
```

## Testing Hooks

```typescript
// apps/web/src/hooks/use-tasks.test.ts
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTasks } from './use-tasks';
import { api } from '@/lib/api';

// Mock the API module
vi.mock('@/lib/api');

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches tasks on mount', async () => {
    const mockTasks = [{ id: '1', title: 'Test Task' }];
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockTasks });

    const { result } = renderHook(() => useTasks());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tasks).toEqual(mockTasks);
  });

  it('creates a task and refreshes', async () => {
    const newTask = { id: '2', title: 'New Task' };
    vi.mocked(api.post).mockResolvedValueOnce({ data: newTask });

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      const created = await result.current.createTask({ title: 'New Task' });
      expect(created).toEqual(newTask);
    });
  });
});
```

## Checklist

- [ ] Hook returns `isLoading` and `error` states
- [ ] Types imported from `@forgestack/shared`
- [ ] Mutations trigger `mutate()` for revalidation
- [ ] Null URL pattern for conditional fetching
- [ ] Hook tests cover loading, success, and error states
- [ ] Optimistic updates for delete/update operations

