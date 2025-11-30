'use client';

/**
 * useWebhooks Hook
 *
 * Hook for managing webhook endpoints and deliveries state.
 * Provides methods to fetch, create, update, delete, and test webhook endpoints.
 */

import { useState, useCallback, useEffect } from 'react';
import { ApiError } from '@/lib/api';
import {
  listWebhookEndpoints,
  createWebhookEndpoint as createWebhookEndpointApi,
  updateWebhookEndpoint as updateWebhookEndpointApi,
  deleteWebhookEndpoint as deleteWebhookEndpointApi,
  testWebhookEndpoint as testWebhookEndpointApi,
  rotateWebhookSecret as rotateWebhookSecretApi,
  listWebhookDeliveries,
  retryWebhookDelivery as retryWebhookDeliveryApi,
} from '@/lib/api/webhooks';
import type {
  WebhookEndpoint,
  WebhookEndpointWithSecret,
  WebhookDelivery,
  CreateWebhookEndpointRequest,
  UpdateWebhookEndpointRequest,
} from '@/types/webhooks';

interface UseWebhookEndpointsOptions {
  orgId: string;
  autoFetch?: boolean;
}

export function useWebhookEndpoints({ orgId, autoFetch = true }: UseWebhookEndpointsOptions) {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch webhook endpoints
  const fetchEndpoints = useCallback(async () => {
    if (!orgId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await listWebhookEndpoints(orgId);
      setEndpoints(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch webhook endpoints';
      setError(message);
      console.error('Error fetching webhook endpoints:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  // Create webhook endpoint
  const createEndpoint = useCallback(
    async (data: CreateWebhookEndpointRequest): Promise<WebhookEndpointWithSecret> => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      setError(null);

      try {
        const newEndpoint = await createWebhookEndpointApi(orgId, data);
        // Add to list (without the secret)
        setEndpoints((prev) => [
          {
            id: newEndpoint.id,
            url: newEndpoint.url,
            description: newEndpoint.description,
            events: newEndpoint.events,
            enabled: newEndpoint.enabled,
            createdAt: newEndpoint.createdAt,
            updatedAt: newEndpoint.updatedAt,
          },
          ...prev,
        ]);
        return newEndpoint;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to create webhook endpoint';
        setError(message);
        throw err;
      }
    },
    [orgId]
  );

  // Update webhook endpoint
  const updateEndpoint = useCallback(
    async (endpointId: string, data: UpdateWebhookEndpointRequest): Promise<WebhookEndpoint> => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      setError(null);

      try {
        const updatedEndpoint = await updateWebhookEndpointApi(orgId, endpointId, data);
        setEndpoints((prev) =>
          prev.map((endpoint) => (endpoint.id === endpointId ? updatedEndpoint : endpoint))
        );
        return updatedEndpoint;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to update webhook endpoint';
        setError(message);
        throw err;
      }
    },
    [orgId]
  );

  // Delete webhook endpoint
  const deleteEndpoint = useCallback(
    async (endpointId: string): Promise<void> => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      setError(null);

      try {
        await deleteWebhookEndpointApi(orgId, endpointId);
        setEndpoints((prev) => prev.filter((endpoint) => endpoint.id !== endpointId));
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to delete webhook endpoint';
        setError(message);
        throw err;
      }
    },
    [orgId]
  );

  // Test webhook endpoint
  const testEndpoint = useCallback(
    async (endpointId: string): Promise<{ message: string }> => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      setError(null);

      try {
        const result = await testWebhookEndpointApi(orgId, endpointId);
        return result;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to test webhook endpoint';
        setError(message);
        throw err;
      }
    },
    [orgId]
  );

  // Rotate webhook secret
  const rotateSecret = useCallback(
    async (endpointId: string): Promise<{ secret: string }> => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      setError(null);

      try {
        const result = await rotateWebhookSecretApi(orgId, endpointId);
        // API returns full endpoint with secret, extract just the secret for the caller
        return { secret: result.secret };
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to rotate webhook secret';
        setError(message);
        throw err;
      }
    },
    [orgId]
  );

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && orgId) {
      fetchEndpoints();
    }
  }, [autoFetch, orgId, fetchEndpoints]);

  return {
    endpoints,
    isLoading,
    error,
    fetchEndpoints,
    createEndpoint,
    updateEndpoint,
    deleteEndpoint,
    testEndpoint,
    rotateSecret,
  };
}

interface UseWebhookDeliveriesOptions {
  orgId: string;
  endpointId?: string;
  autoFetch?: boolean;
}

export function useWebhookDeliveries({ orgId, endpointId, autoFetch = true }: UseWebhookDeliveriesOptions) {
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch webhook deliveries
  const fetchDeliveries = useCallback(async () => {
    if (!orgId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await listWebhookDeliveries(orgId, endpointId);
      setDeliveries(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch webhook deliveries';
      setError(message);
      console.error('Error fetching webhook deliveries:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, endpointId]);

  // Retry webhook delivery
  const retryDelivery = useCallback(
    async (deliveryId: string): Promise<{ message: string }> => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      setError(null);

      try {
        const result = await retryWebhookDeliveryApi(orgId, deliveryId);
        // Refresh deliveries list after retry
        fetchDeliveries();
        return result;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to retry webhook delivery';
        setError(message);
        throw err;
      }
    },
    [orgId, fetchDeliveries]
  );

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && orgId) {
      fetchDeliveries();
    }
  }, [autoFetch, orgId, fetchDeliveries]);

  return {
    deliveries,
    isLoading,
    error,
    fetchDeliveries,
    retryDelivery,
  };
}


