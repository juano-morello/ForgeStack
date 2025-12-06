/**
 * Stripe Usage Report Handler Tests
 */

import { Job } from 'bullmq';
import { handleStripeUsageReport, StripeUsageReportJobData } from '../stripe-usage-report.handler';
import { withServiceContext } from '@forgestack/db';

// Mock database context
jest.mock('@forgestack/db', () => ({
  withServiceContext: jest.fn(),
  usageRecords: {},
  subscriptions: {},
  eq: jest.fn(),
  and: jest.fn(),
  gte: jest.fn(),
  lte: jest.fn(),
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
      secretKey: 'sk_test_123',
    },
  },
}));

// Mock Stripe
const mockRetrieve = jest.fn();
const mockCreate = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    subscriptions: {
      retrieve: mockRetrieve,
    },
    billing: {
      meterEvents: {
        create: mockCreate,
      },
    },
  }));
});

describe('StripeUsageReportHandler', () => {
  const mockWithServiceContext = withServiceContext as jest.MockedFunction<typeof withServiceContext>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRetrieve.mockReset();
    mockCreate.mockReset();
  });

  describe('handleStripeUsageReport', () => {
    it('should report usage to Stripe successfully', async () => {
      const mockUsageRecords = [
        {
          id: 'record-1',
          orgId: 'org-1',
          metricType: 'api_calls',
          quantity: 1000,
          periodStart: new Date('2024-01-01T00:00:00Z'),
          periodEnd: new Date('2024-01-01T23:59:59Z'),
          reportedToStripe: false,
        },
        {
          id: 'record-2',
          orgId: 'org-1',
          metricType: 'api_calls',
          quantity: 500,
          periodStart: new Date('2024-01-01T00:00:00Z'),
          periodEnd: new Date('2024-01-01T23:59:59Z'),
          reportedToStripe: false,
        },
      ];

      const mockSubscription = {
        stripeSubscriptionId: 'sub_123',
        customerId: 'cus_123',
      };

      const mockStripeSubscription = {
        id: 'sub_123',
        items: {
          data: [
            {
              id: 'si_123',
              price: {
                id: 'price_123',
                recurring: {
                  usage_type: 'metered',
                },
              },
            },
          ],
        },
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);

      let callCount = 0;
      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        callCount++;
        
        // First call: get unreported records
        if (callCount === 1) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => mockUsageRecords,
              }),
            }),
          } as unknown as Parameters<typeof callback>[0]);
        }

        // Second call: get subscription
        if (callCount === 2) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => ({
                  limit: () => [mockSubscription],
                }),
              }),
            }),
          } as unknown as Parameters<typeof callback>[0]);
        }

        // Third call: mark as reported
        return callback({
          update: mockUpdate,
        } as unknown as Parameters<typeof callback>[0]);
      });

      mockUpdate.mockReturnValue({ set: mockSet });
      mockSet.mockReturnValue({ where: mockWhere });

      mockRetrieve.mockResolvedValue(mockStripeSubscription);
      mockCreate.mockResolvedValue({ id: 'meter_event_123' });

      const jobData: StripeUsageReportJobData = {
        date: '2024-01-01',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<StripeUsageReportJobData>;

      const result = await handleStripeUsageReport(mockJob);

      expect(result).toEqual({
        success: true,
        date: '2024-01-01',
        reportedOrgs: 1,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        event_name: 'api_calls',
        payload: {
          stripe_customer_id: 'sub_123',
          value: '1500', // 1000 + 500
        },
        timestamp: expect.any(Number),
      });

      expect(mockSet).toHaveBeenCalledWith({
        reportedToStripe: true,
        stripeUsageRecordId: expect.stringContaining('meter_event_org-1'),
        reportedAt: expect.any(Date),
      });
    });

    it('should skip orgs without active subscription', async () => {
      const mockUsageRecords = [
        {
          id: 'record-1',
          orgId: 'org-1',
          metricType: 'api_calls',
          quantity: 1000,
          periodStart: new Date('2024-01-01T00:00:00Z'),
          periodEnd: new Date('2024-01-01T23:59:59Z'),
          reportedToStripe: false,
        },
      ];

      let callCount = 0;
      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        callCount++;

        if (callCount === 1) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => mockUsageRecords,
              }),
            }),
          } as unknown as Parameters<typeof callback>[0]);
        }

        // No subscription found
        return callback({
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => [],
              }),
            }),
          }),
        } as unknown as Parameters<typeof callback>[0]);
      });

      const jobData: StripeUsageReportJobData = {
        date: '2024-01-01',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<StripeUsageReportJobData>;

      const result = await handleStripeUsageReport(mockJob);

      expect(result).toEqual({
        success: true,
        date: '2024-01-01',
        reportedOrgs: 0,
      });

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should skip orgs without metered price', async () => {
      const mockUsageRecords = [
        {
          id: 'record-1',
          orgId: 'org-1',
          metricType: 'api_calls',
          quantity: 1000,
          periodStart: new Date('2024-01-01T00:00:00Z'),
          periodEnd: new Date('2024-01-01T23:59:59Z'),
          reportedToStripe: false,
        },
      ];

      const mockSubscription = {
        stripeSubscriptionId: 'sub_123',
        customerId: 'cus_123',
      };

      const mockStripeSubscription = {
        id: 'sub_123',
        items: {
          data: [
            {
              id: 'si_123',
              price: {
                id: 'price_123',
                recurring: {
                  usage_type: 'licensed', // Not metered
                },
              },
            },
          ],
        },
      };

      let callCount = 0;
      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        callCount++;

        if (callCount === 1) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => mockUsageRecords,
              }),
            }),
          } as unknown as Parameters<typeof callback>[0]);
        }

        return callback({
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => [mockSubscription],
              }),
            }),
          }),
        } as unknown as Parameters<typeof callback>[0]);
      });

      mockRetrieve.mockResolvedValue(mockStripeSubscription);

      const jobData: StripeUsageReportJobData = {
        date: '2024-01-01',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<StripeUsageReportJobData>;

      const result = await handleStripeUsageReport(mockJob);

      expect(result).toEqual({
        success: true,
        date: '2024-01-01',
        reportedOrgs: 0,
      });

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should handle Stripe API errors gracefully', async () => {
      const mockUsageRecords = [
        {
          id: 'record-1',
          orgId: 'org-1',
          metricType: 'api_calls',
          quantity: 1000,
          periodStart: new Date('2024-01-01T00:00:00Z'),
          periodEnd: new Date('2024-01-01T23:59:59Z'),
          reportedToStripe: false,
        },
      ];

      const mockSubscription = {
        stripeSubscriptionId: 'sub_123',
        customerId: 'cus_123',
      };

      const mockStripeSubscription = {
        id: 'sub_123',
        items: {
          data: [
            {
              id: 'si_123',
              price: {
                id: 'price_123',
                recurring: {
                  usage_type: 'metered',
                },
              },
            },
          ],
        },
      };

      let callCount = 0;
      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        callCount++;

        if (callCount === 1) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => mockUsageRecords,
              }),
            }),
          } as unknown as Parameters<typeof callback>[0]);
        }

        return callback({
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => [mockSubscription],
              }),
            }),
          }),
        } as unknown as Parameters<typeof callback>[0]);
      });

      mockRetrieve.mockResolvedValue(mockStripeSubscription);
      mockCreate.mockRejectedValue(new Error('Stripe API error'));

      const jobData: StripeUsageReportJobData = {
        date: '2024-01-01',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<StripeUsageReportJobData>;

      const result = await handleStripeUsageReport(mockJob);

      expect(result).toEqual({
        success: true,
        date: '2024-01-01',
        reportedOrgs: 0,
      });
    });

    it('should use yesterday as default date', async () => {
      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        return callback({
          select: () => ({
            from: () => ({
              where: () => [],
            }),
          }),
        } as unknown as Parameters<typeof callback>[0]);
      });

      const jobData: StripeUsageReportJobData = {};

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<StripeUsageReportJobData>;

      const result = await handleStripeUsageReport(mockJob);

      expect(result.success).toBe(true);
      expect(result.date).toBeTruthy();
    });
  });
});


