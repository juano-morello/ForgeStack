/**
 * Webhooks API Client
 *
 * API functions for webhook endpoint and delivery management.
 */

import { api } from '@/lib/api';
import type {
  WebhookEndpoint,
  WebhookEndpointWithSecret,
  WebhookDelivery,
  CreateWebhookEndpointRequest,
  UpdateWebhookEndpointRequest,
} from '@/types/webhooks';

/**
 * Create a new webhook endpoint
 */
export async function createWebhookEndpoint(
  orgId: string,
  data: CreateWebhookEndpointRequest
): Promise<WebhookEndpointWithSecret> {
  try {
    const response = await api.post<WebhookEndpointWithSecret>('/webhooks/endpoints', data);
    return response;
  } catch (error) {
    console.error('Failed to create webhook endpoint:', error);
    throw error;
  }
}

/**
 * List all webhook endpoints for an organization
 */
export async function listWebhookEndpoints(_orgId: string): Promise<WebhookEndpoint[]> {
  try {
    // API returns array directly, not wrapped in { data, total }
    const response = await api.get<WebhookEndpoint[]>('/webhooks/endpoints');
    return response;
  } catch (error) {
    console.error('Failed to list webhook endpoints:', error);
    throw error;
  }
}

/**
 * Get a single webhook endpoint by ID
 */
export async function getWebhookEndpoint(orgId: string, endpointId: string): Promise<WebhookEndpoint> {
  try {
    const response = await api.get<WebhookEndpoint>(`/webhooks/endpoints/${endpointId}`);
    return response;
  } catch (error) {
    console.error('Failed to get webhook endpoint:', error);
    throw error;
  }
}

/**
 * Update a webhook endpoint
 */
export async function updateWebhookEndpoint(
  orgId: string,
  endpointId: string,
  data: UpdateWebhookEndpointRequest
): Promise<WebhookEndpoint> {
  try {
    const response = await api.patch<WebhookEndpoint>(`/webhooks/endpoints/${endpointId}`, data);
    return response;
  } catch (error) {
    console.error('Failed to update webhook endpoint:', error);
    throw error;
  }
}

/**
 * Delete a webhook endpoint
 */
export async function deleteWebhookEndpoint(orgId: string, endpointId: string): Promise<void> {
  try {
    await api.delete<void>(`/webhooks/endpoints/${endpointId}`);
  } catch (error) {
    console.error('Failed to delete webhook endpoint:', error);
    throw error;
  }
}

/**
 * Test a webhook endpoint by sending a test.ping event
 */
export async function testWebhookEndpoint(
  orgId: string,
  endpointId: string
): Promise<{ message: string }> {
  try {
    const response = await api.post<{ message: string }>(
      `/webhooks/endpoints/${endpointId}/test`
    );
    return response;
  } catch (error) {
    console.error('Failed to test webhook endpoint:', error);
    throw error;
  }
}

/**
 * Rotate webhook secret
 * Returns the full endpoint including the new unmasked secret
 */
export async function rotateWebhookSecret(
  orgId: string,
  endpointId: string
): Promise<WebhookEndpointWithSecret> {
  try {
    const response = await api.post<WebhookEndpointWithSecret>(
      `/webhooks/endpoints/${endpointId}/rotate-secret`
    );
    return response;
  } catch (error) {
    console.error('Failed to rotate webhook secret:', error);
    throw error;
  }
}

/**
 * List webhook deliveries
 */
export async function listWebhookDeliveries(
  _orgId: string,
  endpointId?: string
): Promise<WebhookDelivery[]> {
  try {
    const endpoint = endpointId
      ? `/webhooks/deliveries?endpointId=${endpointId}`
      : '/webhooks/deliveries';
    // API returns paginated response with items array
    const response = await api.get<{ items: WebhookDelivery[]; total: number; page: number; limit: number }>(endpoint);
    return response.items;
  } catch (error) {
    console.error('Failed to list webhook deliveries:', error);
    throw error;
  }
}

/**
 * Get a single webhook delivery by ID
 */
export async function getWebhookDelivery(orgId: string, deliveryId: string): Promise<WebhookDelivery> {
  try {
    const response = await api.get<WebhookDelivery>(`/webhooks/deliveries/${deliveryId}`);
    return response;
  } catch (error) {
    console.error('Failed to get webhook delivery:', error);
    throw error;
  }
}

/**
 * Retry a failed webhook delivery
 */
export async function retryWebhookDelivery(
  orgId: string,
  deliveryId: string
): Promise<{ message: string }> {
  try {
    const response = await api.post<{ message: string }>(`/webhooks/deliveries/${deliveryId}/retry`);
    return response;
  } catch (error) {
    console.error('Failed to retry webhook delivery:', error);
    throw error;
  }
}

