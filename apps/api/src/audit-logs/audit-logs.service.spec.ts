/**
 * Audit Logs Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsRepository } from './audit-logs.repository';
import { QueueService } from '../queue/queue.service';
import type { TenantContext } from '@forgestack/db';

describe('AuditLogsService', () => {
  let service: AuditLogsService;
  let auditLogsRepository: jest.Mocked<AuditLogsRepository>;
  let queueService: jest.Mocked<QueueService>;

  const mockTenantContext: TenantContext = {
    orgId: 'org-123',
    userId: 'user-123',
    role: 'MEMBER',
  };

  const mockAuditLog = {
    id: 'log-123',
    orgId: 'org-123',
    actorId: 'user-123',
    actorType: 'user',
    actorName: 'Test User',
    actorEmail: 'test@example.com',
    action: 'project.created',
    resourceType: 'project',
    resourceId: 'proj-123',
    resourceName: 'Test Project',
    changes: null,
    metadata: null,
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockAuditLogsRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      getStats: jest.fn(),
    };

    const mockQueueService = {
      addJob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogsService,
        {
          provide: AuditLogsRepository,
          useValue: mockAuditLogsRepository,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    service = module.get<AuditLogsService>(AuditLogsService);
    auditLogsRepository = module.get(AuditLogsRepository);
    queueService = module.get(QueueService);

    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should queue audit log event', async () => {
      const context = {
        orgId: 'org-123',
        actorId: 'user-123',
        actorType: 'user' as const,
        actorName: 'Test User',
        actorEmail: 'test@example.com',
      };

      const event = {
        action: 'project.created',
        resourceType: 'project',
        resourceId: 'proj-123',
      };

      await service.log(context, event);

      expect(queueService.addJob).toHaveBeenCalledWith(
        'audit-logs',
        expect.objectContaining({
          ...context,
          ...event,
        }),
        expect.any(Object),
      );
    });

    it('should not throw on queue error', async () => {
      queueService.addJob.mockRejectedValueOnce(new Error('Queue error'));

      const context = {
        orgId: 'org-123',
        actorId: 'user-123',
        actorType: 'user' as const,
      };

      const event = {
        action: 'project.created',
        resourceType: 'project',
      };

      await expect(service.log(context, event)).resolves.not.toThrow();
    });
  });

  describe('processAuditEvent', () => {
    it('should create audit log in database', async () => {
      const auditEvent = {
        orgId: 'org-123',
        actorId: 'user-123',
        actorType: 'user' as const,
        actorName: 'Test User',
        actorEmail: 'test@example.com',
        action: 'project.created',
        resourceType: 'project',
        resourceId: 'proj-123',
        resourceName: 'Test Project',
      };

      auditLogsRepository.create.mockResolvedValue(mockAuditLog);

      await service.processAuditEvent(auditEvent);

      expect(auditLogsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-123',
          actorId: 'user-123',
          action: 'project.created',
          resourceType: 'project',
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      const query = {
        page: 1,
        limit: 10,
      };

      const mockResult = {
        items: [mockAuditLog],
        page: 1,
        limit: 10,
        total: 1,
      };

      auditLogsRepository.findAll.mockResolvedValue(mockResult);

      const result = await service.findAll(mockTenantContext, query);

      expect(result.data).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('findById', () => {
    it('should return audit log by ID', async () => {
      auditLogsRepository.findById.mockResolvedValue(mockAuditLog);

      const result = await service.findById(mockTenantContext, 'log-123');

      expect(result).toMatchObject({
        id: 'log-123',
        action: 'project.created',
        resource: {
          type: 'project',
          id: 'proj-123',
          name: 'Test Project',
        },
      });
    });

    it('should throw NotFoundException when log not found', async () => {
      auditLogsRepository.findById.mockResolvedValue(null);

      await expect(
        service.findById(mockTenantContext, 'log-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return audit log statistics', async () => {
      const mockStats = {
        totalLogs: 100,
        byAction: { 'project.created': 50, 'project.updated': 50 },
        byResourceType: { project: 100 },
        byActor: [{ actorId: 'user-123', actorName: 'Test User', count: 100 }],
      };

      auditLogsRepository.getStats.mockResolvedValue(mockStats);

      const result = await service.getStats(mockTenantContext, {});

      expect(result).toMatchObject({
        totalLogs: 100,
        byAction: mockStats.byAction,
        byResourceType: mockStats.byResourceType,
        byActor: mockStats.byActor,
      });
    });
  });

  describe('export', () => {
    it('should export audit logs as JSON', async () => {
      const mockResult = {
        items: [mockAuditLog],
        page: 1,
        limit: 10000,
        total: 1,
      };

      auditLogsRepository.findAll.mockResolvedValue(mockResult);

      const result = await service.export(mockTenantContext, {}, 'json');

      expect(result).toContain('log-123');
      expect(result).toContain('project.created');
    });

    it('should export audit logs as CSV', async () => {
      const mockResult = {
        items: [mockAuditLog],
        page: 1,
        limit: 10000,
        total: 1,
      };

      auditLogsRepository.findAll.mockResolvedValue(mockResult);

      const result = await service.export(mockTenantContext, {}, 'csv');

      expect(result).toContain('ID,Created At');
      expect(result).toContain('log-123');
      expect(result).toContain('project.created');
    });
  });
});

