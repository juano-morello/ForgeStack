/**
 * Tests for useWebhookEndpoints and useWebhookDeliveries Hooks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWebhookEndpoints } from './use-webhooks';
import * as webhooksApi from '@/lib/api/webhooks';
import type { WebhookEndpoint, WebhookEndpointWithSecret } from '@/types/webhooks';

// Mock the API module
vi.mock('@/lib/api/webhooks');

describe('useWebhookEndpoints', () => {
  const mockOrgId = 'org-123';
  const mockEndpoints: WebhookEndpoint[] = [
    {
      id: 'endpoint-1',
      url: 'https://example.com/webhook',
      description: 'Test endpoint',
      events: ['project.created', 'project.updated'],
      enabled: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch endpoints on mount when autoFetch is true', async () => {
    vi.mocked(webhooksApi.listWebhookEndpoints).mockResolvedValue(mockEndpoints);

    const { result } = renderHook(() =>
      useWebhookEndpoints({ orgId: mockOrgId, autoFetch: true })
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.endpoints).toEqual(mockEndpoints);
    expect(webhooksApi.listWebhookEndpoints).toHaveBeenCalledWith(mockOrgId);
  });

  it('should not fetch endpoints on mount when autoFetch is false', () => {
    vi.mocked(webhooksApi.listWebhookEndpoints).mockResolvedValue(mockEndpoints);

    renderHook(() => useWebhookEndpoints({ orgId: mockOrgId, autoFetch: false }));

    expect(webhooksApi.listWebhookEndpoints).not.toHaveBeenCalled();
  });

  it('should create a new endpoint', async () => {
    const mockCreatedEndpoint: WebhookEndpointWithSecret = {
      ...mockEndpoints[0],
      secret: 'whsec_abc123',
    };

    vi.mocked(webhooksApi.listWebhookEndpoints).mockResolvedValue([]);
    vi.mocked(webhooksApi.createWebhookEndpoint).mockResolvedValue(mockCreatedEndpoint);

    const { result } = renderHook(() =>
      useWebhookEndpoints({ orgId: mockOrgId, autoFetch: false })
    );

    const newEndpoint = await result.current.createEndpoint({
      url: 'https://example.com/webhook',
      events: ['project.created'],
    });

    await waitFor(() => {
      expect(result.current.endpoints).toHaveLength(1);
    });

    expect(newEndpoint).toEqual(mockCreatedEndpoint);
    expect(webhooksApi.createWebhookEndpoint).toHaveBeenCalledWith(mockOrgId, {
      url: 'https://example.com/webhook',
      events: ['project.created'],
    });
  });

  it('should update an endpoint', async () => {
    const updatedEndpoint = { ...mockEndpoints[0], enabled: false };

    vi.mocked(webhooksApi.listWebhookEndpoints).mockResolvedValue(mockEndpoints);
    vi.mocked(webhooksApi.updateWebhookEndpoint).mockResolvedValue(updatedEndpoint);

    const { result } = renderHook(() =>
      useWebhookEndpoints({ orgId: mockOrgId, autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.endpoints).toHaveLength(1);
    });

    await result.current.updateEndpoint('endpoint-1', { enabled: false });

    await waitFor(() => {
      expect(result.current.endpoints[0].enabled).toBe(false);
    });

    expect(webhooksApi.updateWebhookEndpoint).toHaveBeenCalledWith(
      mockOrgId,
      'endpoint-1',
      { enabled: false }
    );
  });

  it('should delete an endpoint', async () => {
    vi.mocked(webhooksApi.listWebhookEndpoints).mockResolvedValue(mockEndpoints);
    vi.mocked(webhooksApi.deleteWebhookEndpoint).mockResolvedValue();

    const { result } = renderHook(() =>
      useWebhookEndpoints({ orgId: mockOrgId, autoFetch: true })
    );

    await waitFor(() => {
      expect(result.current.endpoints).toHaveLength(1);
    });

    await result.current.deleteEndpoint('endpoint-1');

    await waitFor(() => {
      expect(result.current.endpoints).toHaveLength(0);
    });

    expect(webhooksApi.deleteWebhookEndpoint).toHaveBeenCalledWith(mockOrgId, 'endpoint-1');
  });

  it('should test an endpoint', async () => {
    vi.mocked(webhooksApi.listWebhookEndpoints).mockResolvedValue(mockEndpoints);
    vi.mocked(webhooksApi.testWebhookEndpoint).mockResolvedValue({ deliveryId: 'delivery-1' });

    const { result } = renderHook(() =>
      useWebhookEndpoints({ orgId: mockOrgId, autoFetch: false })
    );

    const testResult = await result.current.testEndpoint('endpoint-1');

    expect(testResult).toEqual({ deliveryId: 'delivery-1' });
    expect(webhooksApi.testWebhookEndpoint).toHaveBeenCalledWith(mockOrgId, 'endpoint-1');
  });
});

