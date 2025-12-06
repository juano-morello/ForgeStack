/**
 * Cleanup Orphaned Files Handler Tests
 */

import { Job } from 'bullmq';
import { withServiceContext } from '@forgestack/db';

// Mock AWS S3 Client
const mockS3Send = jest.fn();
const mockDeleteObjectCommand = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockS3Send,
    })),
    DeleteObjectCommand: mockDeleteObjectCommand,
  };
});

// Mock database context
jest.mock('@forgestack/db', () => ({
  withServiceContext: jest.fn(),
  files: {},
  eq: jest.fn(),
  and: jest.fn(),
  isNull: jest.fn(),
  lt: jest.fn(),
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

// Import after mocks
import { handleCleanupOrphanedFiles, CleanupOrphanedFilesJobData } from '../cleanup-orphaned-files.handler';

describe('CleanupOrphanedFilesHandler', () => {
  const mockWithServiceContext = withServiceContext as jest.MockedFunction<typeof withServiceContext>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Send.mockReset();
    mockS3Send.mockResolvedValue({});
    mockDeleteObjectCommand.mockReset();
    mockDeleteObjectCommand.mockImplementation((params) => params);
  });

  describe('handleCleanupOrphanedFiles', () => {
    it('should cleanup orphaned files successfully', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          key: 'org-1/orphan1.txt',
          orgId: 'org-1',
          size: 512,
          uploadedAt: null,
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'file-2',
          key: 'org-2/orphan2.txt',
          orgId: 'org-2',
          size: 1024,
          uploadedAt: null,
          createdAt: new Date('2024-01-01'),
        },
      ];

      const mockDelete = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);

      let callCount = 0;
      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        callCount++;
        
        // First call: select orphaned files
        if (callCount === 1) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => ({
                  limit: () => mockFiles,
                }),
              }),
            }),
          } as unknown as Parameters<typeof callback>[0]);
        }

        // Subsequent calls: delete individual files
        return callback({
          delete: mockDelete,
        } as unknown as Parameters<typeof callback>[0]);
      });

      mockDelete.mockReturnValue({ where: mockWhere });

      const jobData: CleanupOrphanedFilesJobData = {
        olderThanHours: 24,
        batchSize: 100,
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<CleanupOrphanedFilesJobData>;

      const result = await handleCleanupOrphanedFiles(mockJob);

      expect(result).toEqual({
        deletedCount: 2,
        failedCount: 0,
        totalProcessed: 2,
      });

      expect(mockS3Send).toHaveBeenCalledTimes(2);
      expect(mockDeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'forgestack-uploads',
        Key: 'org-1/orphan1.txt',
      });
      expect(mockDeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'forgestack-uploads',
        Key: 'org-2/orphan2.txt',
      });
    });

    it('should use default values when not provided', async () => {
      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        return callback({
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => [],
              }),
            }),
          }),
        } as unknown as Parameters<typeof callback>[0]);
      });

      const jobData: CleanupOrphanedFilesJobData = {};

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<CleanupOrphanedFilesJobData>;

      const result = await handleCleanupOrphanedFiles(mockJob);

      expect(result).toEqual({
        deletedCount: 0,
        failedCount: 0,
        totalProcessed: 0,
      });
    });

    it('should handle S3 deletion failures gracefully', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          key: 'org-1/orphan1.txt',
          orgId: 'org-1',
          size: 512,
          uploadedAt: null,
          createdAt: new Date('2024-01-01'),
        },
      ];

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        return callback({
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => mockFiles,
              }),
            }),
          }),
        } as unknown as Parameters<typeof callback>[0]);
      });

      mockS3Send.mockRejectedValue(new Error('S3 error'));

      const jobData: CleanupOrphanedFilesJobData = {};

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<CleanupOrphanedFilesJobData>;

      const result = await handleCleanupOrphanedFiles(mockJob);

      expect(result).toEqual({
        deletedCount: 0,
        failedCount: 1,
        totalProcessed: 1,
      });
    });

    it('should handle database deletion failures gracefully', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          key: 'org-1/orphan1.txt',
          orgId: 'org-1',
          size: 512,
          uploadedAt: null,
          createdAt: new Date('2024-01-01'),
        },
      ];

      let callCount = 0;
      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        callCount++;

        if (callCount === 1) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => ({
                  limit: () => mockFiles,
                }),
              }),
            }),
          } as unknown as Parameters<typeof callback>[0]);
        }

        throw new Error('Database error');
      });

      const jobData: CleanupOrphanedFilesJobData = {};

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<CleanupOrphanedFilesJobData>;

      const result = await handleCleanupOrphanedFiles(mockJob);

      expect(result).toEqual({
        deletedCount: 0,
        failedCount: 1,
        totalProcessed: 1,
      });
    });
  });
});


