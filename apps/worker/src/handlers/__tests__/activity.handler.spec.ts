/**
 * Activity Handler Tests
 */

import { Job } from 'bullmq';
import { handleActivity, ActivityJobData } from '../activity.handler';
import { withServiceContext } from '@forgestack/db';

// Mock database context
jest.mock('@forgestack/db', () => ({
  withServiceContext: jest.fn(),
  activities: {},
  eq: jest.fn(),
  gte: jest.fn(),
  and: jest.fn(),
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

describe('ActivityHandler', () => {
  const mockWithServiceContext = withServiceContext as jest.MockedFunction<typeof withServiceContext>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleActivity - Simple (non-aggregatable) activities', () => {
    it('should process simple activity type', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockValues = jest.fn().mockResolvedValue(undefined);

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        const mockDb = {
          insert: mockInsert,
          values: mockValues,
        };
        mockInsert.mockReturnValue({ values: mockValues });
        return callback(mockDb as unknown as Parameters<typeof callback>[0]);
      });

      const jobData: ActivityJobData = {
        orgId: 'org-123',
        actorId: 'user-123',
        actorName: 'John Doe',
        type: 'project.created',
        title: 'created a project',
        description: 'Created project "My Project"',
        resourceType: 'project',
        resourceId: 'proj-123',
        resourceName: 'My Project',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<ActivityJobData>;

      const result = await handleActivity(mockJob);

      expect(result).toEqual({
        success: true,
        type: 'project.created',
      });

      expect(mockWithServiceContext).toHaveBeenCalledWith(
        'activity-handler-simple',
        expect.any(Function)
      );
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith({
        orgId: 'org-123',
        actorId: 'user-123',
        actorName: 'John Doe',
        actorAvatar: null,
        type: 'project.created',
        title: 'created a project',
        description: 'Created project "My Project"',
        resourceType: 'project',
        resourceId: 'proj-123',
        resourceName: 'My Project',
        metadata: null,
        aggregationKey: null,
        aggregationCount: 1,
      });
    });

    it('should handle missing optional fields', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockValues = jest.fn().mockResolvedValue(undefined);

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        const mockDb = {
          insert: mockInsert,
          values: mockValues,
        };
        mockInsert.mockReturnValue({ values: mockValues });
        return callback(mockDb as unknown as Parameters<typeof callback>[0]);
      });

      const jobData: ActivityJobData = {
        orgId: 'org-123',
        actorId: 'user-123',
        type: 'project.created',
        title: 'created a project',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<ActivityJobData>;

      await handleActivity(mockJob);

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          actorName: null,
          actorAvatar: null,
          description: null,
          resourceType: null,
          resourceId: null,
          resourceName: null,
          metadata: null,
        })
      );
    });
  });

  describe('handleActivity - Aggregatable activities', () => {
    it('should create new aggregated activity for file.uploaded', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue([]);
      const mockInsert = jest.fn().mockReturnThis();
      const mockValues = jest.fn().mockResolvedValue(undefined);

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        const mockDb = {
          select: mockSelect,
          from: mockFrom,
          where: mockWhere,
          limit: mockLimit,
          insert: mockInsert,
          values: mockValues,
        };
        mockSelect.mockReturnValue({ from: mockFrom });
        mockFrom.mockReturnValue({ where: mockWhere });
        mockWhere.mockReturnValue({ limit: mockLimit });
        mockInsert.mockReturnValue({ values: mockValues });
        return callback(mockDb as unknown as Parameters<typeof callback>[0]);
      });

      const jobData: ActivityJobData = {
        orgId: 'org-123',
        actorId: 'user-123',
        actorName: 'John Doe',
        type: 'file.uploaded',
        title: 'uploaded a file',
        resourceType: 'file',
        resourceId: 'file-123',
        resourceName: 'document.pdf',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<ActivityJobData>;

      const result = await handleActivity(mockJob);

      expect(result).toEqual({
        success: true,
        type: 'file.uploaded',
      });
    });
  });
});

