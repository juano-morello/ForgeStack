import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { IncomingWebhooksService } from './incoming-webhooks.service';
import { IncomingWebhooksRepository } from './incoming-webhooks.repository';
import { StripeWebhookService } from './stripe-webhook.service';
import { QueueService } from '../queue/queue.service';

describe('IncomingWebhooksService', () => {
  let service: IncomingWebhooksService;
  let repository: IncomingWebhooksRepository;
  let stripeWebhookService: StripeWebhookService;
  let queueService: QueueService;

  const mockStripeEvent = {
    id: 'evt_test_123',
    type: 'customer.subscription.updated',
    data: { object: {} },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncomingWebhooksService,
        {
          provide: IncomingWebhooksRepository,
          useValue: {
            findByProviderAndEventId: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: StripeWebhookService,
          useValue: {
            verifySignature: jest.fn(),
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

    service = module.get<IncomingWebhooksService>(IncomingWebhooksService);
    repository = module.get<IncomingWebhooksRepository>(IncomingWebhooksRepository);
    stripeWebhookService = module.get<StripeWebhookService>(StripeWebhookService);
    queueService = module.get<QueueService>(QueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleStripeWebhook', () => {
    const rawBody = Buffer.from(JSON.stringify(mockStripeEvent));
    const signature = 'test_signature';

    it('should throw BadRequestException if signature verification fails', async () => {
      jest.spyOn(stripeWebhookService, 'verifySignature').mockImplementation(() => {
        throw new BadRequestException('Invalid webhook signature');
      });

      await expect(
        service.handleStripeWebhook(rawBody, signature)
      ).rejects.toThrow(BadRequestException);
    });

    it('should return existing event if duplicate', async () => {
      const existingEvent = {
        id: 'record_123',
        provider: 'stripe',
        eventId: 'evt_test_123',
        eventType: 'customer.subscription.updated',
        payload: mockStripeEvent,
        signature,
        verified: true,
        processedAt: null,
        error: null,
        retryCount: 0,
        createdAt: new Date(),
        orgId: null,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(stripeWebhookService, 'verifySignature').mockReturnValue(mockStripeEvent as any);
      jest.spyOn(repository, 'findByProviderAndEventId').mockResolvedValue(existingEvent);

      const result = await service.handleStripeWebhook(rawBody, signature);

      expect(result.eventId).toBe('evt_test_123');
      expect(result.eventRecordId).toBe('record_123');
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should create new event and queue for processing', async () => {
      const newEvent = {
        id: 'record_456',
        provider: 'stripe',
        eventId: 'evt_test_123',
        eventType: 'customer.subscription.updated',
        payload: mockStripeEvent,
        signature,
        verified: true,
        processedAt: null,
        error: null,
        retryCount: 0,
        createdAt: new Date(),
        orgId: null,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(stripeWebhookService, 'verifySignature').mockReturnValue(mockStripeEvent as any);
      jest.spyOn(repository, 'findByProviderAndEventId').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockResolvedValue(newEvent);
      jest.spyOn(queueService, 'addJob').mockResolvedValue(undefined);

      const result = await service.handleStripeWebhook(rawBody, signature);

      expect(result.eventId).toBe('evt_test_123');
      expect(result.eventRecordId).toBe('record_456');
      expect(repository.create).toHaveBeenCalledWith({
        provider: 'stripe',
        eventType: 'customer.subscription.updated',
        eventId: 'evt_test_123',
        payload: mockStripeEvent,
        signature,
        verified: true,
        orgId: null,
      });
      expect(queueService.addJob).toHaveBeenCalledWith('incoming-webhook-processing', {
        eventRecordId: 'record_456',
        provider: 'stripe',
        eventType: 'customer.subscription.updated',
        eventId: 'evt_test_123',
      });
    });
  });

  describe('processWebhookEvent', () => {
    it('should throw error if event not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      await expect(
        service.processWebhookEvent('non_existent_id')
      ).rejects.toThrow('Event record not found: non_existent_id');
    });

    it('should skip already processed events', async () => {
      const processedEvent = {
        id: 'record_123',
        provider: 'stripe',
        eventId: 'evt_test_123',
        eventType: 'customer.subscription.updated',
        payload: mockStripeEvent,
        signature: 'sig',
        verified: true,
        processedAt: new Date(),
        error: null,
        retryCount: 0,
        createdAt: new Date(),
        orgId: null,
      };

      jest.spyOn(repository, 'findById').mockResolvedValue(processedEvent);

      await service.processWebhookEvent('record_123');

      // Should not throw and should log that it's already processed
    });
  });
});

