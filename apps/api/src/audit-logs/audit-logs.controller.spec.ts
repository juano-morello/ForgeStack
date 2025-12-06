/**
 * Audit Logs Controller Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { BillingService } from '../billing/billing.service';
import type { TenantContext } from '@forgestack/db';

describe('AuditLogsController', () => {
  let controller: AuditLogsController;
  let auditLogsService: jest.Mocked<AuditLogsService>;
  let billingService: jest.Mocked<BillingService>;

  const mockTenantContext: TenantContext = {
    orgId: 'org-123',
    userId: 'user-123',
    role: 'MEMBER',
  };

  const mockAuditLog = {
    id: 'log-123',
    actor: {
      id: 'user-123',
      type: 'user',
      name: 'Test User',
      email: 'test@example.com',
    },
    action: 'project.created',
    resource: {
      type: 'project',
      id: 'proj-123',
      name: 'Test Project',
    },
    changes: null,
    metadata: null,
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockAuditLogsService = {
      log: jest.fn(),
      processAuditEvent: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      getStats: jest.fn(),
      export: jest.fn(),
    };

    const mockBillingService = {
      requireFeature: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogsController],
      providers: [
        {
          provide: AuditLogsService,
          useValue: mockAuditLogsService,
        },
        {
          provide: BillingService,
          useValue: mockBillingService,
        },
      ],
    }).compile();

    controller = module.get<AuditLogsController>(AuditLogsController);
    auditLogsService = module.get(AuditLogsService);
    billingService = module.get(BillingService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      const query = { page: 1, limit: 10 };
      const mockResult = {
        data: [mockAuditLog],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      billingService.requireFeature.mockResolvedValue(undefined);
      auditLogsService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(mockTenantContext, query);

      expect(result).toEqual(mockResult);
      expect(billingService.requireFeature).toHaveBeenCalledWith(mockTenantContext, 'audit-logs');
      expect(auditLogsService.findAll).toHaveBeenCalledWith(mockTenantContext, query);
    });
  });

  describe('getStats', () => {
    it('should return audit log statistics', async () => {
      const query = {};
      const mockStats = {
        totalLogs: 100,
        byAction: { 'project.created': 50 },
        byResourceType: { project: 100 },
        byActor: [{ actorId: 'user-123', actorName: 'Test User', count: 100 }],
        period: { start: null, end: null },
      };

      auditLogsService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats(mockTenantContext, query);

      expect(result).toEqual(mockStats);
      expect(auditLogsService.getStats).toHaveBeenCalledWith(mockTenantContext, query);
    });
  });

  describe('findOne', () => {
    it('should return audit log by ID', async () => {
      auditLogsService.findById.mockResolvedValue(mockAuditLog);

      const result = await controller.findOne(mockTenantContext, 'log-123');

      expect(result).toEqual(mockAuditLog);
      expect(auditLogsService.findById).toHaveBeenCalledWith(mockTenantContext, 'log-123');
    });
  });

  describe('export', () => {
    it('should export audit logs as JSON', async () => {
      const query = {};
      const mockExport = JSON.stringify([mockAuditLog]);

      auditLogsService.export.mockResolvedValue(mockExport);

      const result = await controller.export(mockTenantContext, query, 'json');

      expect(result).toEqual(mockExport);
      expect(auditLogsService.export).toHaveBeenCalledWith(mockTenantContext, query, 'json');
    });

    it('should export audit logs as CSV', async () => {
      const query = {};
      const mockExport = 'ID,Created At\nlog-123,2024-01-01';

      auditLogsService.export.mockResolvedValue(mockExport);

      const result = await controller.export(mockTenantContext, query, 'csv');

      expect(result).toEqual(mockExport);
      expect(auditLogsService.export).toHaveBeenCalledWith(mockTenantContext, query, 'csv');
    });
  });
});

