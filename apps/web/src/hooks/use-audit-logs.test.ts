import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuditLogs, useAuditLogStats } from './use-audit-logs';
import * as auditLogsApi from '@/lib/api/audit-logs';

vi.mock('@/lib/api/audit-logs');

describe('useAuditLogs', () => {
  const mockOrgId = 'org-123';
  const mockLogs = [
    {
      id: 'log-1',
      orgId: mockOrgId,
      actorId: 'user-1',
      actorType: 'user' as const,
      actorName: 'John Doe',
      actorEmail: 'john@example.com',
      action: 'project.created',
      resourceType: 'project',
      resourceId: 'proj-1',
      resourceName: 'Test Project',
      changes: null,
      metadata: null,
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      createdAt: '2024-01-15T10:00:00Z',
    },
  ];

  const mockResponse = {
    data: mockLogs,
    pagination: {
      page: 1,
      limit: 50,
      total: 1,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches audit logs on mount when autoFetch is true', async () => {
    vi.mocked(auditLogsApi.listAuditLogs).mockResolvedValue(mockResponse);

    const { result } = renderHook(() =>
      useAuditLogs({ orgId: mockOrgId, autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(auditLogsApi.listAuditLogs).toHaveBeenCalledWith(mockOrgId, undefined);
    expect(result.current.logs).toEqual(mockLogs);
    expect(result.current.pagination).toEqual(mockResponse.pagination);
  });

  it('does not fetch audit logs when autoFetch is false', () => {
    vi.mocked(auditLogsApi.listAuditLogs).mockResolvedValue(mockResponse);

    renderHook(() => useAuditLogs({ orgId: mockOrgId, autoFetch: false }));

    expect(auditLogsApi.listAuditLogs).not.toHaveBeenCalled();
  });

  it('handles fetch error', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(auditLogsApi.listAuditLogs).mockRejectedValue(error);

    const { result } = renderHook(() =>
      useAuditLogs({ orgId: mockOrgId, autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch audit logs');
    expect(result.current.logs).toEqual([]);
  });

  it('loads specific page', async () => {
    vi.mocked(auditLogsApi.listAuditLogs).mockResolvedValue(mockResponse);

    const { result } = renderHook(() =>
      useAuditLogs({ orgId: mockOrgId, autoFetch: false })
    );

    await result.current.loadPage(2);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(auditLogsApi.listAuditLogs).toHaveBeenCalledWith(mockOrgId, { page: 2 });
  });
});

describe('useAuditLogStats', () => {
  const mockOrgId = 'org-123';
  const mockStats = {
    totalLogs: 100,
    byAction: {
      created: 50,
      updated: 30,
      deleted: 20,
    },
    byResourceType: {
      project: 60,
      member: 40,
    },
    byActor: [
      { actorId: 'user-1', actorName: 'John Doe', count: 50 },
      { actorId: 'user-2', actorName: 'Jane Smith', count: 50 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches stats on mount when autoFetch is true', async () => {
    vi.mocked(auditLogsApi.getAuditLogStats).mockResolvedValue(mockStats);

    const { result } = renderHook(() =>
      useAuditLogStats({ orgId: mockOrgId, autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(auditLogsApi.getAuditLogStats).toHaveBeenCalledWith(mockOrgId, undefined);
    expect(result.current.stats).toEqual(mockStats);
  });

  it('does not fetch stats when autoFetch is false', () => {
    vi.mocked(auditLogsApi.getAuditLogStats).mockResolvedValue(mockStats);

    renderHook(() => useAuditLogStats({ orgId: mockOrgId, autoFetch: false }));

    expect(auditLogsApi.getAuditLogStats).not.toHaveBeenCalled();
  });

  it('handles fetch error', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(auditLogsApi.getAuditLogStats).mockRejectedValue(error);

    const { result } = renderHook(() =>
      useAuditLogStats({ orgId: mockOrgId, autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch audit log stats');
    expect(result.current.stats).toBeNull();
  });
});

