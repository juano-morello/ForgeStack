import { Test, TestingModule } from '@nestjs/testing';
import { BillingRepository } from './billing.repository';

// Mock @forgestack/db
jest.mock('@forgestack/db', () => ({
  withServiceContext: jest.fn((reason, fn) => fn(mockTx)),
  withTenantContext: jest.fn((ctx, fn) => fn(mockTx)),
  customers: { orgId: 'orgId', stripeCustomerId: 'stripeCustomerId' },
  subscriptions: { orgId: 'orgId', stripeSubscriptionId: 'stripeSubscriptionId' },
  billingEvents: { stripeEventId: 'stripeEventId' },
  eq: jest.fn((field, value) => ({ field, value })),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockTx: any;

const resetMockTx = () => {
  mockTx = {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{ id: 'test-id' }]),
    onConflictDoUpdate: jest.fn().mockReturnThis(),
  };
};

describe('BillingRepository', () => {
  let repository: BillingRepository;

  beforeEach(async () => {
    jest.clearAllMocks();
    resetMockTx();

    const module: TestingModule = await Test.createTestingModule({
      providers: [BillingRepository],
    }).compile();

    repository = module.get<BillingRepository>(BillingRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('createCustomer', () => {
    it('should create a customer', async () => {
      const customerData = {
        orgId: 'org-123',
        stripeCustomerId: 'cus_123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const result = await repository.createCustomer(customerData);

      expect(result).toEqual({ id: 'test-id' });
      expect(mockTx.insert).toHaveBeenCalled();
      expect(mockTx.values).toHaveBeenCalledWith(customerData);
      expect(mockTx.returning).toHaveBeenCalled();
    });
  });

  describe('findCustomerByOrgId', () => {
    it('should find customer by org ID', async () => {
      // Mock the select chain to return an array
      mockTx.where.mockResolvedValueOnce([{ id: 'cust-123', orgId: 'org-123' }]);

      const result = await repository.findCustomerByOrgId('org-123');

      expect(result).toEqual({ id: 'cust-123', orgId: 'org-123' });
      expect(mockTx.select).toHaveBeenCalled();
      expect(mockTx.where).toHaveBeenCalled();
    });

    it('should return null if customer not found', async () => {
      mockTx.where.mockResolvedValueOnce([]);

      const result = await repository.findCustomerByOrgId('org-123');

      expect(result).toBeNull();
    });
  });

  describe('findCustomerByStripeId', () => {
    it('should find customer by Stripe ID', async () => {
      mockTx.where.mockResolvedValueOnce([{ id: 'cust-123', stripeCustomerId: 'cus_123' }]);

      const result = await repository.findCustomerByStripeId('cus_123');

      expect(result).toEqual({ id: 'cust-123', stripeCustomerId: 'cus_123' });
      expect(mockTx.select).toHaveBeenCalled();
      expect(mockTx.where).toHaveBeenCalled();
    });
  });

  describe('upsertSubscription', () => {
    it('should upsert a subscription', async () => {
      const subscriptionData = {
        orgId: 'org-123',
        customerId: 'cust-123',
        stripeSubscriptionId: 'sub_123',
        stripePriceId: 'price_123',
        plan: 'pro',
        status: 'active',
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await repository.upsertSubscription(subscriptionData as any);

      expect(result).toEqual({ id: 'test-id' });
      expect(mockTx.insert).toHaveBeenCalled();
      expect(mockTx.values).toHaveBeenCalledWith(subscriptionData);
      expect(mockTx.onConflictDoUpdate).toHaveBeenCalled();
      expect(mockTx.returning).toHaveBeenCalled();
    });
  });

  describe('findSubscriptionByOrgId', () => {
    it('should find subscription by org ID', async () => {
      const ctx = { orgId: 'org-123', userId: 'user-123', role: 'OWNER' as const };
      mockTx.where.mockResolvedValueOnce([{ id: 'sub-123', orgId: 'org-123' }]);

      const result = await repository.findSubscriptionByOrgId(ctx);

      expect(result).toEqual({ id: 'sub-123', orgId: 'org-123' });
      expect(mockTx.select).toHaveBeenCalled();
      expect(mockTx.where).toHaveBeenCalled();
    });
  });

  describe('logBillingEvent', () => {
    it('should log a billing event', async () => {
      const eventData = {
        stripeEventId: 'evt_123',
        eventType: 'customer.subscription.created',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload: { id: 'evt_123' } as any,
        orgId: 'org-123',
      };

      const result = await repository.logBillingEvent(eventData);

      expect(result).toEqual({ id: 'test-id' });
      expect(mockTx.insert).toHaveBeenCalled();
      expect(mockTx.values).toHaveBeenCalledWith(eventData);
      expect(mockTx.returning).toHaveBeenCalled();
    });
  });

  describe('markEventProcessed', () => {
    it('should mark event as processed', async () => {
      await repository.markEventProcessed('evt_123');

      expect(mockTx.update).toHaveBeenCalled();
      expect(mockTx.set).toHaveBeenCalled();
      expect(mockTx.where).toHaveBeenCalled();
    });

    it('should mark event as processed with error', async () => {
      await repository.markEventProcessed('evt_123', 'Test error');

      expect(mockTx.update).toHaveBeenCalled();
      expect(mockTx.set).toHaveBeenCalled();
      expect(mockTx.where).toHaveBeenCalled();
    });
  });
});

