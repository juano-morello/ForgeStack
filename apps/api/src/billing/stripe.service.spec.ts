import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';

describe('StripeService', () => {
  let service: StripeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'STRIPE_SECRET_KEY') return 'sk_test_123';
              if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_123';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with Stripe API key', () => {
    const instance = service.getStripeInstance();
    expect(instance).toBeDefined();
  });

  it('should throw error if STRIPE_SECRET_KEY is not configured', () => {
    expect(() => {
      new StripeService({
        get: jest.fn(() => null),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }).toThrow('STRIPE_SECRET_KEY is not configured');
  });
});

