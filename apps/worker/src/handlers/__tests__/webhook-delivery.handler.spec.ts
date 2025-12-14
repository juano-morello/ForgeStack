/**
 * Webhook Delivery Handler Tests
 */

import { Job } from 'bullmq';
import { withServiceContext } from '@forgestack/db';

// Mock database context
jest.mock('@forgestack/db', () => ({
  withServiceContext: jest.fn(),
  webhookDeliveries: {},
  webhookEndpoints: {},
  eq: jest.fn(),
}));

// Mock the logger - must be defined before the mock
const mockLoggerInstance = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

jest.mock('../../telemetry/logger', () => ({
  createLogger: jest.fn(() => mockLoggerInstance),
}));

// Import after mocks
import { handleWebhookDelivery, WebhookDeliveryJobData } from '../webhook-delivery.handler';

// Mock global fetch
global.fetch = jest.fn();

describe('WebhookDeliveryHandler', () => {
  const mockWithServiceContext = withServiceContext as jest.MockedFunction<typeof withServiceContext>;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('handleWebhookDelivery', () => {
    it('should successfully deliver webhook', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue([{ secret: 'webhook-secret' }]);

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        const mockDb = {
          update: mockUpdate,
          set: mockSet,
          where: mockWhere,
          select: mockSelect,
          from: mockFrom,
          limit: mockLimit,
        };
        mockUpdate.mockReturnValue({ set: mockSet });
        mockSet.mockReturnValue({ where: mockWhere });
        mockSelect.mockReturnValue({ from: mockFrom });
        mockFrom.mockReturnValue({ where: jest.fn().mockReturnValue({ limit: mockLimit }) });
        return callback(mockDb as unknown as Parameters<typeof callback>[0]);
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      const jobData: WebhookDeliveryJobData = {
        deliveryId: 'delivery-123',
        endpointId: 'endpoint-123',
        orgId: 'org-123',
        url: 'https://example.com/webhook',
        eventId: 'event-123',
        eventType: 'project.created',
        payload: { id: 'proj-123', name: 'Test Project' },
        attemptNumber: 1,
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<WebhookDeliveryJobData>;

      const result = await handleWebhookDelivery(mockJob);

      expect(result).toEqual({
        success: true,
        status: 200,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Webhook-Id': 'event-123',
            'User-Agent': 'ForgeStack-Webhooks/1.0',
          }),
          body: JSON.stringify({ id: 'proj-123', name: 'Test Project' }),
        })
      );

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          responseStatus: 200,
          deliveredAt: expect.any(Date),
          error: null,
        })
      );
    });

    it('should handle failed webhook delivery', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue([{ secret: 'webhook-secret' }]);

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        const mockDb = {
          update: mockUpdate,
          set: mockSet,
          where: mockWhere,
          select: mockSelect,
          from: mockFrom,
          limit: mockLimit,
        };
        mockUpdate.mockReturnValue({ set: mockSet });
        mockSet.mockReturnValue({ where: mockWhere });
        mockSelect.mockReturnValue({ from: mockFrom });
        mockFrom.mockReturnValue({ where: jest.fn().mockReturnValue({ limit: mockLimit }) });
        return callback(mockDb as unknown as Parameters<typeof callback>[0]);
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
        headers: new Headers(),
      } as Response);

      const jobData: WebhookDeliveryJobData = {
        deliveryId: 'delivery-123',
        endpointId: 'endpoint-123',
        orgId: 'org-123',
        url: 'https://example.com/webhook',
        eventId: 'event-123',
        eventType: 'project.created',
        payload: { id: 'proj-123' },
        attemptNumber: 1,
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<WebhookDeliveryJobData>;

      await expect(handleWebhookDelivery(mockJob)).rejects.toThrow('Webhook returned 500');

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          responseStatus: 500,
          error: 'HTTP 500',
          nextRetryAt: expect.any(Date),
        })
      );
    });

    it('should include webhook signature in headers', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue([{ secret: 'webhook-secret' }]);

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        return callback({
          update: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue(undefined),
          select: mockSelect,
          from: mockFrom,
          limit: mockLimit,
        } as unknown as Parameters<typeof callback>[0]);
      });

      mockSelect.mockReturnValue({ from: mockFrom });
      mockFrom.mockReturnValue({ where: jest.fn().mockReturnValue({ limit: mockLimit }) });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => 'OK',
        headers: new Headers(),
      } as Response);

      const jobData: WebhookDeliveryJobData = {
        deliveryId: 'delivery-123',
        endpointId: 'endpoint-123',
        orgId: 'org-123',
        url: 'https://example.com/webhook',
        eventId: 'event-123',
        eventType: 'project.created',
        payload: {},
        attemptNumber: 1,
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<WebhookDeliveryJobData>;

      await handleWebhookDelivery(mockJob);

      const fetchCall = mockFetch.mock.calls[0];
      const headers = fetchCall[1]?.headers as Record<string, string>;

      expect(headers['X-Webhook-Signature']).toBeDefined();
      expect(headers['X-Webhook-Signature']).toMatch(/^t=\d+,v1=[a-f0-9]+$/);
    });

    it('should handle missing endpoint secret', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue([]); // No secret found

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        const mockDb = {
          update: mockUpdate,
          set: mockSet,
          where: mockWhere,
          select: mockSelect,
          from: mockFrom,
          limit: mockLimit,
        };
        mockUpdate.mockReturnValue({ set: mockSet });
        mockSet.mockReturnValue({ where: mockWhere });
        mockSelect.mockReturnValue({ from: mockFrom });
        mockFrom.mockReturnValue({ where: jest.fn().mockReturnValue({ limit: mockLimit }) });
        return callback(mockDb as unknown as Parameters<typeof callback>[0]);
      });

      const jobData: WebhookDeliveryJobData = {
        deliveryId: 'delivery-123',
        endpointId: 'endpoint-123',
        orgId: 'org-123',
        url: 'https://example.com/webhook',
        eventId: 'event-123',
        eventType: 'project.created',
        payload: {},
        attemptNumber: 1,
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<WebhookDeliveryJobData>;

      const result = await handleWebhookDelivery(mockJob);

      expect(result).toEqual({
        success: false,
        error: 'Endpoint not found',
      });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Endpoint not found or secret missing',
          failedAt: expect.any(Date),
        })
      );

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should log warning when endpoint exhausts all retry attempts (HTTP error)', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue([{ secret: 'webhook-secret' }]);

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        const mockDb = {
          update: mockUpdate,
          set: mockSet,
          where: mockWhere,
          select: mockSelect,
          from: mockFrom,
          limit: mockLimit,
        };
        mockUpdate.mockReturnValue({ set: mockSet });
        mockSet.mockReturnValue({ where: mockWhere });
        mockSelect.mockReturnValue({ from: mockFrom });
        mockFrom.mockReturnValue({ where: jest.fn().mockReturnValue({ limit: mockLimit }) });
        return callback(mockDb as unknown as Parameters<typeof callback>[0]);
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
        headers: new Headers(),
      } as Response);

      const jobData: WebhookDeliveryJobData = {
        deliveryId: 'delivery-123',
        endpointId: 'endpoint-123',
        orgId: 'org-123',
        url: 'https://example.com/webhook',
        eventId: 'event-123',
        eventType: 'project.created',
        payload: { id: 'proj-123' },
        attemptNumber: 5, // Max attempts reached
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<WebhookDeliveryJobData>;

      await expect(handleWebhookDelivery(mockJob)).rejects.toThrow('Webhook returned 500');

      expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          endpointId: 'endpoint-123',
          url: 'https://example.com/webhook',
          deliveryId: 'delivery-123',
        }),
        'Webhook endpoint has exhausted all retry attempts. Consider disabling if failures persist.'
      );
    });

    it('should log warning when endpoint exhausts all retry attempts (network error)', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue([{ secret: 'webhook-secret' }]);

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        const mockDb = {
          update: mockUpdate,
          set: mockSet,
          where: mockWhere,
          select: mockSelect,
          from: mockFrom,
          limit: mockLimit,
        };
        mockUpdate.mockReturnValue({ set: mockSet });
        mockSet.mockReturnValue({ where: mockWhere });
        mockSelect.mockReturnValue({ from: mockFrom });
        mockFrom.mockReturnValue({ where: jest.fn().mockReturnValue({ limit: mockLimit }) });
        return callback(mockDb as unknown as Parameters<typeof callback>[0]);
      });

      mockFetch.mockRejectedValue(new Error('Network error'));

      const jobData: WebhookDeliveryJobData = {
        deliveryId: 'delivery-456',
        endpointId: 'endpoint-456',
        orgId: 'org-123',
        url: 'https://example.com/webhook',
        eventId: 'event-456',
        eventType: 'project.updated',
        payload: { id: 'proj-456' },
        attemptNumber: 5, // Max attempts reached
      };

      const mockJob = {
        id: 'job-456',
        data: jobData,
      } as Job<WebhookDeliveryJobData>;

      await expect(handleWebhookDelivery(mockJob)).rejects.toThrow('Network error');

      expect(mockLoggerInstance.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          endpointId: 'endpoint-456',
          url: 'https://example.com/webhook',
          deliveryId: 'delivery-456',
        }),
        'Webhook endpoint has exhausted all retry attempts. Consider disabling if failures persist.'
      );
    });
  });
});

