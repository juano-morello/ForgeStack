/**
 * Stripe Webhook Handler Tests
 */

import { Job } from 'bullmq';
import { handleStripeWebhook, StripeWebhookJobData } from '../stripe-webhook.handler';
import { withServiceContext } from '@forgestack/db';
import type Stripe from 'stripe';

// Mock database context
jest.mock('@forgestack/db', () => ({
  withServiceContext: jest.fn(),
  billingEvents: {},
  customers: {},
  subscriptions: {},
  organizations: {},
  organizationMembers: {},
  eq: jest.fn(),
  and: jest.fn(),
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

// Mock BullMQ Queue
jest.mock('bullmq', () => {
  const actualBullMQ = jest.requireActual('bullmq');
  return {
    ...actualBullMQ,
    Queue: jest.fn().mockImplementation(() => ({
      add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
      close: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

// Mock IORedis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    quit: jest.fn().mockResolvedValue(undefined),
  }));
});

describe('StripeWebhookHandler', () => {
  const mockWithServiceContext = withServiceContext as jest.MockedFunction<typeof withServiceContext>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleStripeWebhook', () => {
    it('should process checkout.session.completed event', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        const mockDb = {
          update: mockUpdate,
          set: mockSet,
          where: mockWhere,
        };
        mockUpdate.mockReturnValue({ set: mockSet });
        mockSet.mockReturnValue({ where: mockWhere });
        return callback(mockDb as unknown as Parameters<typeof callback>[0]);
      });

      const payload = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
            subscription: 'sub_123',
          },
        },
      } as Stripe.CheckoutSessionCompletedEvent;

      const jobData: StripeWebhookJobData = {
        eventId: 'evt_123',
        eventType: 'checkout.session.completed',
        payload,
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<StripeWebhookJobData>;

      const result = await handleStripeWebhook(mockJob);

      expect(result).toEqual({
        success: true,
        eventId: 'evt_123',
      });

      // Should mark event as processed
      expect(mockSet).toHaveBeenCalledWith({ processedAt: expect.any(Date) });
    });

    it('should process customer.subscription.created event', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([
        {
          id: 'customer-123',
          orgId: 'org-123',
          stripeCustomerId: 'cus_123',
        },
      ]);
      const mockInsert = jest.fn().mockReturnThis();
      const mockValues = jest.fn().mockReturnThis();
      const mockOnConflictDoUpdate = jest.fn().mockResolvedValue(undefined);
      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();

      let callCount = 0;
      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        callCount++;
        
        if (callCount === 1) {
          // First call: find customer
          const mockDb = {
            select: mockSelect,
            from: mockFrom,
            where: mockWhere,
          };
          mockSelect.mockReturnValue({ from: mockFrom });
          mockFrom.mockReturnValue({ where: mockWhere });
          return callback(mockDb as unknown as Parameters<typeof callback>[0]);
        } else if (callCount === 2) {
          // Second call: upsert subscription
          const mockDb = {
            insert: mockInsert,
            values: mockValues,
            onConflictDoUpdate: mockOnConflictDoUpdate,
          };
          mockInsert.mockReturnValue({ values: mockValues });
          mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
          return callback(mockDb as unknown as Parameters<typeof callback>[0]);
        } else {
          // Third call: mark event as processed
          const mockDb = {
            update: mockUpdate,
            set: mockSet,
            where: jest.fn().mockResolvedValue(undefined),
          };
          mockUpdate.mockReturnValue({ set: mockSet });
          mockSet.mockReturnValue({ where: mockDb.where });
          return callback(mockDb as unknown as Parameters<typeof callback>[0]);
        }
      });

      const payload = {
        id: 'evt_123',
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
                },
              ],
            },
            cancel_at_period_end: false,
            canceled_at: null,
          },
        },
      } as Stripe.CustomerSubscriptionCreatedEvent;

      const jobData: StripeWebhookJobData = {
        eventId: 'evt_123',
        eventType: 'customer.subscription.created',
        payload,
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<StripeWebhookJobData>;

      const result = await handleStripeWebhook(mockJob);

      expect(result).toEqual({
        success: true,
        eventId: 'evt_123',
      });

      expect(mockInsert).toHaveBeenCalled();
    });
  });
});

