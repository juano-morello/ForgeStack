import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksRepository } from './webhooks.repository';
import { QueueService } from '../queue/queue.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

// Mock the @forgestack/db module
jest.mock('@forgestack/db', () => ({
  withTenantContext: jest.fn(),
  withServiceContext: jest.fn(),
  webhookEndpoints: {},
  webhookDeliveries: {},
  eq: jest.fn(),
  and: jest.fn(),
  desc: jest.fn(),
  count: jest.fn(),
  isNull: jest.fn(),
  isNotNull: jest.fn(),
  lt: jest.fn(),
}));

import type { OrgRole } from '@forgestack/shared';

interface TenantContext {
  orgId: string;
  userId: string;
  role: OrgRole;
}

describe('WebhooksService', () => {
  let service: WebhooksService;
  let repository: jest.Mocked<WebhooksRepository>;

  const mockOrgId = '550e8400-e29b-41d4-a716-446655440000';
  const mockUserId = '660e8400-e29b-41d4-a716-446655440001';
  const mockEndpointId = '770e8400-e29b-41d4-a716-446655440002';

  const ownerContext: TenantContext = {
    orgId: mockOrgId,
    userId: mockUserId,
    role: 'OWNER',
  };

  const memberContext: TenantContext = {
    orgId: mockOrgId,
    userId: mockUserId,
    role: 'MEMBER',
  };

  beforeEach(async () => {
    const mockRepository = {
      createEndpoint: jest.fn(),
      findEndpointById: jest.fn(),
      findEndpointsByOrgId: jest.fn(),
      updateEndpoint: jest.fn(),
      deleteEndpoint: jest.fn(),
      findEndpointsByEvent: jest.fn(),
      createDelivery: jest.fn(),
      updateDelivery: jest.fn(),
      findDeliveryById: jest.fn(),
      findDeliveriesByOrgId: jest.fn(),
      countEndpointsByOrgId: jest.fn(),
    };

    const mockQueueService = {
      addJob: jest.fn(),
    };

    const mockAuditLogsService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: WebhooksRepository,
          useValue: mockRepository,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
        {
          provide: AuditLogsService,
          useValue: mockAuditLogsService,
        },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
    repository = module.get(WebhooksRepository) as jest.Mocked<WebhooksRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createEndpoint', () => {
    const createDto = {
      url: 'https://example.com/webhook',
      description: 'Test webhook',
      events: ['project.created' as const],
    };

    it('should throw ForbiddenException if user is not OWNER', async () => {
      await expect(service.createEndpoint(memberContext, createDto)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw BadRequestException if endpoint limit reached', async () => {
      repository.countEndpointsByOrgId.mockResolvedValue(10);

      await expect(service.createEndpoint(ownerContext, createDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should create endpoint with generated secret', async () => {
      repository.countEndpointsByOrgId.mockResolvedValue(0);
      repository.createEndpoint.mockResolvedValue({
        id: mockEndpointId,
        orgId: mockOrgId,
        url: createDto.url,
        description: createDto.description,
        secret: 'whsec_test123',
        events: createDto.events,
        enabled: true,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createEndpoint(ownerContext, createDto);

      expect(repository.countEndpointsByOrgId).toHaveBeenCalledWith(mockOrgId);
      expect(repository.createEndpoint).toHaveBeenCalled();
      expect(result.id).toBe(mockEndpointId);
      expect(result.secret).toMatch(/^whsec_/);
    });
  });

  describe('listEndpoints', () => {
    it('should throw ForbiddenException if user is not OWNER', async () => {
      await expect(service.listEndpoints(memberContext)).rejects.toThrow(ForbiddenException);
    });

    it('should return endpoints with masked secrets', async () => {
      const mockEndpoints = [
        {
          id: mockEndpointId,
          orgId: mockOrgId,
          url: 'https://example.com/webhook',
          description: 'Test',
          secret: 'whsec_verylongsecretkey123456',
          events: ['project.created'],
          enabled: true,
          createdBy: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      repository.findEndpointsByOrgId.mockResolvedValue(mockEndpoints);

      const result = await service.listEndpoints(ownerContext);

      expect(result).toHaveLength(1);
      expect(result[0].secret).toContain('***');
      expect(result[0].secret).not.toBe(mockEndpoints[0].secret);
    });
  });
});

