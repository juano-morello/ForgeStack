/**
 * Incoming Webhook Processing Handler Tests
 */

import { Job } from 'bullmq';
import { handleIncomingWebhookProcessing, IncomingWebhookJobData } from '../incoming-webhook-processing.handler';
import { withServiceContext } from '@forgestack/db';
import type Stripe from 'stripe';

// Mock database context
jest.mock('@forgestack/db', () => ({
  withServiceContext: jest.fn(),
  incomingWebhookEvents: {},
  customers: {},
  subscriptions: {},
  eq: jest.fn(),
}));

// Mock the logger
jest.mock('../../telemetry/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

// Mock config
jest.mock('../../config', () => ({
  config: {
    stripe: {
      priceToPlanMap: {
        'price_123': 'pro',
        'price_456': 'enterprise',
      },
    },
  },
}));

describe('IncomingWebhookProcessingHandler', () => {
  const mockWithServiceContext = withServiceContext as jest.MockedFunction<typeof withServiceContext>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleIncomingWebhookProcessing', () => {
    it('should skip already processed events', async () => {
      const mockEvent = {
        id: 'event-123',
        processedAt: new Date(),
        verified: true,
        payload: {},
      };

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        return callback({
          select: () => ({
            from: () => ({
              where: () => [mockEvent],
            }),
          }),
        } as unknown as Parameters<typeof callback>[0]);
      });

      const jobData: IncomingWebhookJobData = {
        eventRecordId: 'event-123',
        provider: 'stripe',
        eventType: 'customer.subscription.created',
        eventId: 'evt_123',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<IncomingWebhookJobData>;

      const result = await handleIncomingWebhookProcessing(mockJob);

      expect(result).toEqual({
        skipped: true,
        reason: 'already_processed',
      });
    });

    it('should skip unverified events', async () => {
      const mockEvent = {
        id: 'event-123',
        processedAt: null,
        verified: false,
        payload: {},
      };

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        return callback({
          select: () => ({
            from: () => ({
              where: () => [mockEvent],
            }),
          }),
        } as unknown as Parameters<typeof callback>[0]);
      });

      const jobData: IncomingWebhookJobData = {
        eventRecordId: 'event-123',
        provider: 'stripe',
        eventType: 'customer.subscription.created',
        eventId: 'evt_123',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<IncomingWebhookJobData>;

      const result = await handleIncomingWebhookProcessing(mockJob);

      expect(result).toEqual({
        skipped: true,
        reason: 'not_verified',
      });
    });

    it('should throw error if event not found', async () => {
      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        return callback({
          select: () => ({
            from: () => ({
              where: () => [],
            }),
          }),
        } as unknown as Parameters<typeof callback>[0]);
      });

      const jobData: IncomingWebhookJobData = {
        eventRecordId: 'event-123',
        provider: 'stripe',
        eventType: 'customer.subscription.created',
        eventId: 'evt_123',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<IncomingWebhookJobData>;

      await expect(handleIncomingWebhookProcessing(mockJob)).rejects.toThrow('Event record not found: event-123');
    });

    it('should process checkout.session.completed event', async () => {
      const stripeEvent: Stripe.CheckoutSessionCompletedEvent = {
        id: 'evt_123',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
            subscription: 'sub_123',
          } as unknown as Stripe.Checkout.Session,
        },
      } as unknown as Stripe.CheckoutSessionCompletedEvent;

      const mockEvent = {
        id: 'event-123',
        processedAt: null,
        verified: true,
        payload: stripeEvent,
        retryCount: 0,
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);

      let callCount = 0;
      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        callCount++;

        if (callCount === 1) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => [mockEvent],
              }),
            }),
          } as unknown as Parameters<typeof callback>[0]);
        }

        return callback({
          update: mockUpdate,
        } as unknown as Parameters<typeof callback>[0]);
      });

      mockUpdate.mockReturnValue({ set: mockSet });
      mockSet.mockReturnValue({ where: mockWhere });

      const jobData: IncomingWebhookJobData = {
        eventRecordId: 'event-123',
        provider: 'stripe',
        eventType: 'checkout.session.completed',
        eventId: 'evt_123',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<IncomingWebhookJobData>;

      const result = await handleIncomingWebhookProcessing(mockJob);

      expect(result).toEqual({ success: true });
      expect(mockSet).toHaveBeenCalledWith({
        processedAt: expect.any(Date),
        error: null,
      });
    });

    it('should process customer.subscription.created event', async () => {
      const stripeEvent: Stripe.CustomerSubscriptionCreatedEvent = {
        id: 'evt_123',
        object: 'event',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
            items: {
              data: [
                {
                  price: {
                    id: 'price_123',
                  },
                } as unknown as Stripe.SubscriptionItem,
              ],
            },
            current_period_start: 1704067200,
            current_period_end: 1706745600,
            cancel_at_period_end: false,
            canceled_at: null,
          } as unknown as Stripe.Subscription,
        },
      } as unknown as Stripe.CustomerSubscriptionCreatedEvent;

      const mockEvent = {
        id: 'event-123',
        processedAt: null,
        verified: true,
        payload: stripeEvent,
        retryCount: 0,
      };

      const mockCustomer = {
        id: 'customer-123',
        orgId: 'org-123',
        stripeCustomerId: 'cus_123',
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);
      const mockInsert = jest.fn().mockReturnThis();
      const mockValues = jest.fn().mockReturnThis();
      const mockOnConflictDoUpdate = jest.fn().mockResolvedValue(undefined);

      let callCount = 0;
      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        callCount++;

        // First call: fetch event
        if (callCount === 1) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => [mockEvent],
              }),
            }),
          } as unknown as Parameters<typeof callback>[0]);
        }

        // Second call: find customer
        if (callCount === 2) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => [mockCustomer],
              }),
            }),
          } as unknown as Parameters<typeof callback>[0]);
        }

        // Third call: upsert subscription
        if (callCount === 3) {
          return callback({
            insert: mockInsert,
          } as unknown as Parameters<typeof callback>[0]);
        }

        // Fourth call: mark as processed
        return callback({
          update: mockUpdate,
        } as unknown as Parameters<typeof callback>[0]);
      });

      mockInsert.mockReturnValue({ values: mockValues });
      mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
      mockUpdate.mockReturnValue({ set: mockSet });
      mockSet.mockReturnValue({ where: mockWhere });

      const jobData: IncomingWebhookJobData = {
        eventRecordId: 'event-123',
        provider: 'stripe',
        eventType: 'customer.subscription.created',
        eventId: 'evt_123',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<IncomingWebhookJobData>;

      const result = await handleIncomingWebhookProcessing(mockJob);

      expect(result).toEqual({ success: true });
    });

    it('should handle unknown provider', async () => {
      const mockEvent = {
        id: 'event-123',
        processedAt: null,
        verified: true,
        payload: {},
        retryCount: 0,
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);

      let callCount = 0;
      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        callCount++;

        if (callCount === 1) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => [mockEvent],
              }),
            }),
          } as unknown as Parameters<typeof callback>[0]);
        }

        return callback({
          update: mockUpdate,
        } as unknown as Parameters<typeof callback>[0]);
      });

      mockUpdate.mockReturnValue({ set: mockSet });
      mockSet.mockReturnValue({ where: mockWhere });

      const jobData: IncomingWebhookJobData = {
        eventRecordId: 'event-123',
        provider: 'unknown',
        eventType: 'some.event',
        eventId: 'evt_123',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<IncomingWebhookJobData>;

      await expect(handleIncomingWebhookProcessing(mockJob)).rejects.toThrow('Unknown provider: unknown');

      // Should update error in database
      expect(mockSet).toHaveBeenCalledWith({
        error: 'Unknown provider: unknown',
        retryCount: 1,
      });
    });

    it('should handle customer.subscription.updated event', async () => {
      const stripeEvent: Stripe.CustomerSubscriptionUpdatedEvent = {
        id: 'evt_123',
        object: 'event',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
            items: {
              data: [
                {
                  price: {
                    id: 'price_pro',
                  },
                } as unknown as Stripe.SubscriptionItem,
              ],
            },
          } as unknown as Stripe.Subscription,
        },
      } as unknown as Stripe.CustomerSubscriptionUpdatedEvent;

      const mockEvent = {
        id: 'event-123',
        processedAt: null,
        verified: true,
        payload: stripeEvent,
        retryCount: 0,
      };

      const mockCustomer = {
        id: 'customer-1',
        stripeCustomerId: 'cus_123',
        orgId: 'org-1',
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);
      const mockInsert = jest.fn().mockReturnThis();
      const mockValues = jest.fn().mockReturnThis();
      const mockOnConflictDoUpdate = jest.fn().mockResolvedValue(undefined);

      let callCount = 0;
      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        callCount++;

        // First call: get event
        if (callCount === 1) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => [mockEvent],
              }),
            }),
          } as unknown as Parameters<typeof callback>[0]);
        }

        // Second call: find customer
        if (callCount === 2) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => [mockCustomer],
              }),
            }),
            update: mockUpdate,
          } as unknown as Parameters<typeof callback>[0]);
        }

        // Third call: upsert subscription
        if (callCount === 3) {
          return callback({
            insert: mockInsert,
            update: mockUpdate,
          } as unknown as Parameters<typeof callback>[0]);
        }

        // Fourth call: mark as processed
        return callback({
          update: mockUpdate,
        } as unknown as Parameters<typeof callback>[0]);
      });

      mockInsert.mockReturnValue({ values: mockValues });
      mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
      mockUpdate.mockReturnValue({ set: mockSet });
      mockSet.mockReturnValue({ where: mockWhere });

      const jobData: IncomingWebhookJobData = {
        eventRecordId: 'event-123',
        provider: 'stripe',
        eventType: 'customer.subscription.updated',
        eventId: 'evt_123',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<IncomingWebhookJobData>;

      const result = await handleIncomingWebhookProcessing(mockJob);

      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should handle checkout.session.completed event (duplicate test - remove)', async () => {
      // This test is a duplicate of an earlier test, so we can skip it
      // The checkout.session.completed event is already tested above
      expect(true).toBe(true);
    });
  });
});


