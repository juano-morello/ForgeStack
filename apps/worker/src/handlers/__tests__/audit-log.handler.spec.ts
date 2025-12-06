/**
 * Audit Log Handler Tests
 */

import { Job } from 'bullmq';
import { handleAuditLog, AuditLogJobData } from '../audit-log.handler';
import { withServiceContext } from '@forgestack/db';

// Mock database context
jest.mock('@forgestack/db', () => ({
  withServiceContext: jest.fn(),
  auditLogs: {},
}));

// Mock the logger
jest.mock('../../telemetry/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe('AuditLogHandler', () => {
  const mockWithServiceContext = withServiceContext as jest.MockedFunction<typeof withServiceContext>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleAuditLog', () => {
    it('should insert audit log with all fields', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockValues = jest.fn().mockResolvedValue(undefined);

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        return callback({
          insert: mockInsert,
        } as unknown as Parameters<typeof callback>[0]);
      });

      mockInsert.mockReturnValue({ values: mockValues });

      const jobData: AuditLogJobData = {
        orgId: 'org-123',
        actorId: 'user-123',
        actorType: 'user',
        actorName: 'John Doe',
        actorEmail: 'john@example.com',
        action: 'created',
        resourceType: 'project',
        resourceId: 'project-123',
        resourceName: 'My Project',
        changes: {
          before: { name: 'Old Name' },
          after: { name: 'New Name' },
        },
        metadata: { source: 'web' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<AuditLogJobData>;

      const result = await handleAuditLog(mockJob);

      expect(result).toEqual({ success: true });
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith({
        orgId: 'org-123',
        actorId: 'user-123',
        actorType: 'user',
        actorName: 'John Doe',
        actorEmail: 'john@example.com',
        action: 'created',
        resourceType: 'project',
        resourceId: 'project-123',
        resourceName: 'My Project',
        changes: {
          before: { name: 'Old Name' },
          after: { name: 'New Name' },
        },
        metadata: { source: 'web' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });
    });

    it('should insert audit log with minimal fields', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockValues = jest.fn().mockResolvedValue(undefined);

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        return callback({
          insert: mockInsert,
        } as unknown as Parameters<typeof callback>[0]);
      });

      mockInsert.mockReturnValue({ values: mockValues });

      const jobData: AuditLogJobData = {
        orgId: 'org-123',
        actorType: 'system',
        action: 'deleted',
        resourceType: 'file',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<AuditLogJobData>;

      const result = await handleAuditLog(mockJob);

      expect(result).toEqual({ success: true });
      expect(mockValues).toHaveBeenCalledWith({
        orgId: 'org-123',
        actorId: null,
        actorType: 'system',
        actorName: null,
        actorEmail: null,
        action: 'deleted',
        resourceType: 'file',
        resourceId: null,
        resourceName: null,
        changes: null,
        metadata: null,
        ipAddress: null,
        userAgent: null,
      });
    });

    it('should handle api_key actor type', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockValues = jest.fn().mockResolvedValue(undefined);

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        return callback({
          insert: mockInsert,
        } as unknown as Parameters<typeof callback>[0]);
      });

      mockInsert.mockReturnValue({ values: mockValues });

      const jobData: AuditLogJobData = {
        orgId: 'org-123',
        actorId: 'key-123',
        actorType: 'api_key',
        action: 'updated',
        resourceType: 'webhook',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<AuditLogJobData>;

      const result = await handleAuditLog(mockJob);

      expect(result).toEqual({ success: true });
    });

    it('should throw error on database failure', async () => {
      mockWithServiceContext.mockRejectedValue(new Error('Database error'));

      const jobData: AuditLogJobData = {
        orgId: 'org-123',
        actorType: 'user',
        action: 'created',
        resourceType: 'project',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<AuditLogJobData>;

      await expect(handleAuditLog(mockJob)).rejects.toThrow('Database error');
    });

    it('should throw error on insert failure', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockValues = jest.fn().mockRejectedValue(new Error('Insert failed'));

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        return callback({
          insert: mockInsert,
        } as unknown as Parameters<typeof callback>[0]);
      });

      mockInsert.mockReturnValue({ values: mockValues });

      const jobData: AuditLogJobData = {
        orgId: 'org-123',
        actorType: 'user',
        action: 'created',
        resourceType: 'project',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<AuditLogJobData>;

      await expect(handleAuditLog(mockJob)).rejects.toThrow('Insert failed');
    });
  });
});


