import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { BillingRepository } from './billing.repository';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';

// Mock the @forgestack/db module to prevent import errors
jest.mock('@forgestack/db', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  withServiceContext: jest.fn(),
  withTenantContext: jest.fn(),
  customers: {},
  subscriptions: {},
  billingEvents: {},
}));

describe('BillingService', () => {
  let service: BillingService;
  let stripeService: jest.Mocked<StripeService>;
  let billingRepository: jest.Mocked<BillingRepository>;
  let featureFlagsService: jest.Mocked<FeatureFlagsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: StripeService,
          useValue: {
            createCustomer: jest.fn(),
            createCheckoutSession: jest.fn(),
            createPortalSession: jest.fn(),
          },
        },
        {
          provide: BillingRepository,
          useValue: {
            findCustomerByOrgId: jest.fn(),
            createCustomer: jest.fn(),
            findSubscriptionByOrgId: jest.fn(),
            logBillingEvent: jest.fn(),
          },
        },
        {
          provide: FeatureFlagsService,
          useValue: {
            isEnabled: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    stripeService = module.get(StripeService);
    billingRepository = module.get(BillingRepository);
    featureFlagsService = module.get(FeatureFlagsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateCustomer', () => {
    it('should return existing customer', async () => {
      const existingCustomer = {
        id: 'cust-123',
        orgId: 'org-123',
        stripeCustomerId: 'cus_123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      billingRepository.findCustomerByOrgId.mockResolvedValue(existingCustomer);

      const result = await service.getOrCreateCustomer('org-123', 'test@example.com', 'Test User');

      expect(result).toEqual({
        customerId: 'cust-123',
        stripeCustomerId: 'cus_123',
      });
      expect(billingRepository.findCustomerByOrgId).toHaveBeenCalledWith('org-123');
      expect(stripeService.createCustomer).not.toHaveBeenCalled();
    });

    it('should create new customer if not exists', async () => {
      billingRepository.findCustomerByOrgId.mockResolvedValue(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stripeService.createCustomer.mockResolvedValue({ id: 'cus_123' } as any);
      billingRepository.createCustomer.mockResolvedValue({
        id: 'cust-123',
        orgId: 'org-123',
        stripeCustomerId: 'cus_123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.getOrCreateCustomer('org-123', 'test@example.com', 'Test User');

      expect(result).toEqual({
        customerId: 'cust-123',
        stripeCustomerId: 'cus_123',
      });
      expect(stripeService.createCustomer).toHaveBeenCalledWith('test@example.com', 'Test User', { orgId: 'org-123' });
      expect(billingRepository.createCustomer).toHaveBeenCalled();
    });
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session', async () => {
      billingRepository.findCustomerByOrgId.mockResolvedValue({
        id: 'cust-123',
        orgId: 'org-123',
        stripeCustomerId: 'cus_123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      stripeService.createCheckoutSession.mockResolvedValue({
        id: 'cs_123',
        url: 'https://checkout.stripe.com/...',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await service.createCheckoutSession(
        'org-123',
        'price_123',
        'https://example.com/success',
        'https://example.com/cancel',
        'test@example.com',
        'Test User',
      );

      expect(result).toEqual({
        sessionId: 'cs_123',
        checkoutUrl: 'https://checkout.stripe.com/...',
      });
      expect(stripeService.createCheckoutSession).toHaveBeenCalled();
    });
  });

  describe('createPortalSession', () => {
    it('should create portal session', async () => {
      billingRepository.findCustomerByOrgId.mockResolvedValue({
        id: 'cust-123',
        orgId: 'org-123',
        stripeCustomerId: 'cus_123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      stripeService.createPortalSession.mockResolvedValue({
        url: 'https://billing.stripe.com/...',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await service.createPortalSession('org-123', 'https://example.com/return');

      expect(result).toEqual({
        portalUrl: 'https://billing.stripe.com/...',
      });
      expect(stripeService.createPortalSession).toHaveBeenCalledWith('cus_123', 'https://example.com/return');
    });

    it('should throw NotFoundException if customer not found', async () => {
      billingRepository.findCustomerByOrgId.mockResolvedValue(null);

      await expect(
        service.createPortalSession('org-123', 'https://example.com/return'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSubscription', () => {
    it('should return subscription if exists', async () => {
      const ctx = { orgId: 'org-123', userId: 'user-123', role: 'OWNER' as const };
      billingRepository.findSubscriptionByOrgId.mockResolvedValue({
        id: 'sub-123',
        orgId: 'org-123',
        customerId: 'cust-123',
        stripeSubscriptionId: 'sub_123',
        stripePriceId: 'price_123',
        plan: 'pro',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.getSubscription(ctx);

      expect(result.plan).toBe('pro');
      expect(result.status).toBe('active');
    });

    it('should return free plan if no subscription', async () => {
      const ctx = { orgId: 'org-123', userId: 'user-123', role: 'OWNER' as const };
      billingRepository.findSubscriptionByOrgId.mockResolvedValue(null);

      const result = await service.getSubscription(ctx);

      expect(result).toEqual({
        plan: 'free',
        status: 'active',
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });
    });
  });

  describe('requireFeature', () => {
    it('should not throw if feature is enabled', async () => {
      const ctx = { orgId: 'org-123', userId: 'user-123', role: 'OWNER' as const };
      featureFlagsService.isEnabled.mockResolvedValue(true);

      await expect(service.requireFeature(ctx, 'audit-logs')).resolves.not.toThrow();
      expect(featureFlagsService.isEnabled).toHaveBeenCalledWith(ctx, 'audit-logs');
    });

    it('should throw ForbiddenException if feature is not enabled', async () => {
      const ctx = { orgId: 'org-123', userId: 'user-123', role: 'OWNER' as const };
      featureFlagsService.isEnabled.mockResolvedValue(false);
      billingRepository.findSubscriptionByOrgId.mockResolvedValue(null);

      await expect(service.requireFeature(ctx, 'audit-logs')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('hasFeature', () => {
    it('should return true if feature is enabled', async () => {
      const ctx = { orgId: 'org-123', userId: 'user-123', role: 'OWNER' as const };
      featureFlagsService.isEnabled.mockResolvedValue(true);

      const result = await service.hasFeature(ctx, 'audit-logs');

      expect(result).toBe(true);
      expect(featureFlagsService.isEnabled).toHaveBeenCalledWith(ctx, 'audit-logs');
    });

    it('should return false if feature is not enabled', async () => {
      const ctx = { orgId: 'org-123', userId: 'user-123', role: 'OWNER' as const };
      featureFlagsService.isEnabled.mockResolvedValue(false);

      const result = await service.hasFeature(ctx, 'audit-logs');

      expect(result).toBe(false);
    });
  });
});

