import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

// Mock the @forgestack/db module
jest.mock('@forgestack/db', () => ({
  withTenantContext: jest.fn(),
  withServiceContext: jest.fn(),
  webhookEndpoints: {},
  webhookDeliveries: {},
  eq: jest.fn(),
}));

import type { OrgRole } from '@forgestack/shared';

interface TenantContext {
  orgId: string;
  userId: string;
  role: OrgRole;
}

describe('WebhooksController', () => {
  let controller: WebhooksController;
  let service: jest.Mocked<WebhooksService>;

  const mockOrgId = '550e8400-e29b-41d4-a716-446655440000';
  const mockUserId = '660e8400-e29b-41d4-a716-446655440001';
  const mockEndpointId = '770e8400-e29b-41d4-a716-446655440002';

  const ownerContext: TenantContext = {
    orgId: mockOrgId,
    userId: mockUserId,
    role: 'OWNER',
  };

  beforeEach(async () => {
    const mockService = {
      createEndpoint: jest.fn(),
      listEndpoints: jest.fn(),
      getEndpoint: jest.fn(),
      updateEndpoint: jest.fn(),
      deleteEndpoint: jest.fn(),
      testEndpoint: jest.fn(),
      rotateSecret: jest.fn(),
      listDeliveries: jest.fn(),
      getDelivery: jest.fn(),
      retryDelivery: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        {
          provide: WebhooksService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<WebhooksController>(WebhooksController);
    service = module.get(WebhooksService) as jest.Mocked<WebhooksService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createEndpoint', () => {
    it('should call service.createEndpoint with correct parameters', async () => {
      const dto = {
        url: 'https://example.com/webhook',
        description: 'Test webhook',
        events: ['project.created' as const],
      };

      const mockEndpoint = {
        id: mockEndpointId,
        orgId: mockOrgId,
        url: dto.url,
        description: dto.description,
        secret: 'whsec_test123',
        events: dto.events,
        enabled: true,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.createEndpoint.mockResolvedValue(mockEndpoint);

      const result = await controller.createEndpoint(ownerContext, dto);

      expect(service.createEndpoint).toHaveBeenCalledWith(ownerContext, dto);
      expect(result).toEqual(mockEndpoint);
    });
  });

  describe('listEndpoints', () => {
    it('should call service.listEndpoints with correct parameters', async () => {
      const mockEndpoints = [
        {
          id: mockEndpointId,
          orgId: mockOrgId,
          url: 'https://example.com/webhook',
          description: 'Test',
          secret: 'whsec_***',
          events: ['project.created'],
          enabled: true,
          createdBy: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      service.listEndpoints.mockResolvedValue(mockEndpoints);

      const result = await controller.listEndpoints(ownerContext);

      expect(service.listEndpoints).toHaveBeenCalledWith(ownerContext);
      expect(result).toEqual(mockEndpoints);
    });
  });

  describe('getEndpoint', () => {
    it('should call service.getEndpoint with correct parameters', async () => {
      const mockEndpoint = {
        id: mockEndpointId,
        orgId: mockOrgId,
        url: 'https://example.com/webhook',
        description: 'Test',
        secret: 'whsec_***',
        events: ['project.created'],
        enabled: true,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.getEndpoint.mockResolvedValue(mockEndpoint);

      const result = await controller.getEndpoint(ownerContext, mockEndpointId);

      expect(service.getEndpoint).toHaveBeenCalledWith(ownerContext, mockEndpointId);
      expect(result).toEqual(mockEndpoint);
    });
  });

  describe('deleteEndpoint', () => {
    it('should call service.deleteEndpoint with correct parameters', async () => {
      service.deleteEndpoint.mockResolvedValue(undefined);

      await controller.deleteEndpoint(ownerContext, mockEndpointId);

      expect(service.deleteEndpoint).toHaveBeenCalledWith(ownerContext, mockEndpointId);
    });
  });
});

