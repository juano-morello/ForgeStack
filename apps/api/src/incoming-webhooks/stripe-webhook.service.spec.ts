import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { StripeWebhookService } from './stripe-webhook.service';

describe('StripeWebhookService', () => {
  let service: StripeWebhookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeWebhookService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'STRIPE_SECRET_KEY') return 'sk_test_123';
              if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_test_123';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StripeWebhookService>(StripeWebhookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw error if STRIPE_SECRET_KEY is not configured', () => {
    expect(() => {
      new StripeWebhookService({
        get: jest.fn((key: string) => {
          if (key === 'STRIPE_SECRET_KEY') return null;
          if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_test_123';
          return null;
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }).toThrow('STRIPE_SECRET_KEY is not configured');
  });

  it('should create service even if STRIPE_WEBHOOK_SECRET is not configured', () => {
    // Service should still be created even without webhook secret (just logs a warning)
    const serviceWithoutWebhookSecret = new StripeWebhookService({
      get: jest.fn((key: string) => {
        if (key === 'STRIPE_SECRET_KEY') return 'sk_test_123';
        if (key === 'STRIPE_WEBHOOK_SECRET') return '';
        return null;
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // The service should be created successfully
    expect(serviceWithoutWebhookSecret).toBeDefined();
  });

  describe('verifySignature', () => {
    it('should throw BadRequestException for invalid signature', () => {
      const rawBody = Buffer.from(JSON.stringify({ test: 'data' }));
      const invalidSignature = 'invalid_signature';

      expect(() => {
        service.verifySignature(rawBody, invalidSignature);
      }).toThrow(BadRequestException);
    });
  });
});

