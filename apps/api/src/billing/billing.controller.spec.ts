import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { QueueService } from '../queue/queue.service';

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

describe('BillingController', () => {
  let controller: BillingController;
  let billingService: jest.Mocked<BillingService>;
  let stripeService: jest.Mocked<StripeService>;
  let queueService: jest.Mocked<QueueService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        {
          provide: BillingService,
          useValue: {
            createCheckoutSession: jest.fn(),
            createPortalSession: jest.fn(),
            getSubscription: jest.fn(),
            handleWebhookEvent: jest.fn(),
          },
        },
        {
          provide: StripeService,
          useValue: {
            constructWebhookEvent: jest.fn(),
          },
        },
        {
          provide: QueueService,
          useValue: {
            addJob: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BillingController>(BillingController);
    billingService = module.get(BillingService);
    stripeService = module.get(StripeService);
    queueService = module.get(QueueService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCheckout', () => {
    const ctx = { orgId: 'org-123', userId: 'user-123', role: 'OWNER' as const };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const request = { user: { id: 'user-123', email: 'test@example.com', name: 'Test User' } } as any;
    const dto = {
      priceId: 'price_123',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    };

    it('should create checkout session for OWNER', async () => {
      billingService.createCheckoutSession.mockResolvedValue({
        sessionId: 'cs_123',
        checkoutUrl: 'https://checkout.stripe.com/...',
      });

      const result = await controller.createCheckout(dto, ctx, request);

      expect(result).toEqual({
        sessionId: 'cs_123',
        checkoutUrl: 'https://checkout.stripe.com/...',
      });
      expect(billingService.createCheckoutSession).toHaveBeenCalledWith(
        'org-123',
        'price_123',
        'https://example.com/success',
        'https://example.com/cancel',
        'test@example.com',
        'Test User',
      );
    });

    it('should throw ForbiddenException for non-OWNER', async () => {
      const memberCtx = { ...ctx, role: 'MEMBER' as const };

      await expect(controller.createCheckout(dto, memberCtx, request)).rejects.toThrow(ForbiddenException);
      expect(billingService.createCheckoutSession).not.toHaveBeenCalled();
    });
  });

  describe('createPortal', () => {
    const ctx = { orgId: 'org-123', userId: 'user-123', role: 'OWNER' as const };
    const dto = { returnUrl: 'https://example.com/return' };

    it('should create portal session for OWNER', async () => {
      billingService.createPortalSession.mockResolvedValue({
        portalUrl: 'https://billing.stripe.com/...',
      });

      const result = await controller.createPortal(dto, ctx);

      expect(result).toEqual({
        portalUrl: 'https://billing.stripe.com/...',
      });
      expect(billingService.createPortalSession).toHaveBeenCalledWith('org-123', 'https://example.com/return');
    });

    it('should throw ForbiddenException for non-OWNER', async () => {
      const memberCtx = { ...ctx, role: 'MEMBER' as const };

      await expect(controller.createPortal(dto, memberCtx)).rejects.toThrow(ForbiddenException);
      expect(billingService.createPortalSession).not.toHaveBeenCalled();
    });
  });

  describe('getSubscription', () => {
    it('should return subscription', async () => {
      const ctx = { orgId: 'org-123', userId: 'user-123', role: 'OWNER' as const };
      billingService.getSubscription.mockResolvedValue({
        plan: 'pro',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
      });

      const result = await controller.getSubscription(ctx);

      expect(result.plan).toBe('pro');
      expect(result.status).toBe('active');
      expect(billingService.getSubscription).toHaveBeenCalledWith(ctx);
    });
  });

  describe('handleWebhook', () => {
    const mockEvent = {
      id: 'evt_123',
      type: 'customer.subscription.created',
      data: { object: {} },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    it('should handle webhook event', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const request = { rawBody: Buffer.from('test') } as any;
      stripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queueService.addJob.mockResolvedValue({ id: 'job-123' } as any);

      const result = await controller.handleWebhook(request, 'test-signature');

      expect(result).toEqual({ received: true });
      expect(stripeService.constructWebhookEvent).toHaveBeenCalledWith(Buffer.from('test'), 'test-signature');
      expect(billingService.handleWebhookEvent).toHaveBeenCalledWith(mockEvent);
      expect(queueService.addJob).toHaveBeenCalledWith('stripe-webhook', {
        eventId: 'evt_123',
        eventType: 'customer.subscription.created',
        payload: mockEvent,
      });
    });

    it('should throw ForbiddenException if signature missing', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const request = { rawBody: Buffer.from('test') } as any;

      await expect(controller.handleWebhook(request, '')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if raw body missing', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const request = {} as any;

      await expect(controller.handleWebhook(request, 'test-signature')).rejects.toThrow(ForbiddenException);
    });
  });
});

