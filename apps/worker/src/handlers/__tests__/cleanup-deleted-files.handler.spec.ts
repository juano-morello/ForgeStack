/**
 * Cleanup Deleted Files Handler Tests
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
  isNotNull: jest.fn(),
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
import { handleCleanupDeletedFiles, CleanupDeletedFilesJobData } from '../cleanup-deleted-files.handler';

describe('CleanupDeletedFilesHandler', () => {
  const mockWithServiceContext = withServiceContext as jest.MockedFunction<typeof withServiceContext>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Send.mockReset();
    mockS3Send.mockResolvedValue({});
    mockDeleteObjectCommand.mockReset();
    mockDeleteObjectCommand.mockImplementation((params) => params);
  });

  describe('handleCleanupDeletedFiles', () => {
    it('should cleanup deleted files successfully', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          key: 'org-1/file1.txt',
          orgId: 'org-1',
          size: 1024,
          deletedAt: new Date('2024-01-01'),
          uploadedAt: new Date('2023-12-01'),
        },
        {
          id: 'file-2',
          key: 'org-2/file2.txt',
          orgId: 'org-2',
          size: 2048,
          deletedAt: new Date('2024-01-01'),
          uploadedAt: new Date('2023-12-01'),
        },
      ];

      const mockDelete = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);

      let callCount = 0;
      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        callCount++;
        
        // First call: select deleted files
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

      const jobData: CleanupDeletedFilesJobData = {
        olderThanDays: 30,
        batchSize: 100,
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<CleanupDeletedFilesJobData>;

      const result = await handleCleanupDeletedFiles(mockJob);

      expect(result).toEqual({
        deletedCount: 2,
        failedCount: 0,
        totalProcessed: 2,
        orgsUpdated: 2,
      });

      expect(mockS3Send).toHaveBeenCalledTimes(2);
      expect(mockDeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'forgestack-uploads',
        Key: 'org-1/file1.txt',
      });
      expect(mockDeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'forgestack-uploads',
        Key: 'org-2/file2.txt',
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

      const jobData: CleanupDeletedFilesJobData = {};

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<CleanupDeletedFilesJobData>;

      const result = await handleCleanupDeletedFiles(mockJob);

      expect(result).toEqual({
        deletedCount: 0,
        failedCount: 0,
        totalProcessed: 0,
        orgsUpdated: 0,
      });
    });

    it('should handle S3 deletion failures gracefully', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          key: 'org-1/file1.txt',
          orgId: 'org-1',
          size: 1024,
          deletedAt: new Date('2024-01-01'),
          uploadedAt: new Date('2023-12-01'),
        },
        {
          id: 'file-2',
          key: 'org-2/file2.txt',
          orgId: 'org-2',
          size: 2048,
          deletedAt: new Date('2024-01-01'),
          uploadedAt: new Date('2023-12-01'),
        },
      ];

      const mockDelete = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);

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

        return callback({
          delete: mockDelete,
        } as unknown as Parameters<typeof callback>[0]);
      });

      mockDelete.mockReturnValue({ where: mockWhere });

      // First S3 call fails, second succeeds
      mockS3Send
        .mockRejectedValueOnce(new Error('S3 error'))
        .mockResolvedValueOnce({});

      const jobData: CleanupDeletedFilesJobData = {};

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<CleanupDeletedFilesJobData>;

      const result = await handleCleanupDeletedFiles(mockJob);

      expect(result).toEqual({
        deletedCount: 1,
        failedCount: 1,
        totalProcessed: 2,
        orgsUpdated: 1,
      });
    });

    it('should handle database deletion failures gracefully', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          key: 'org-1/file1.txt',
          orgId: 'org-1',
          size: 1024,
          deletedAt: new Date('2024-01-01'),
          uploadedAt: new Date('2023-12-01'),
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

        // Database delete fails
        throw new Error('Database error');
      });

      const jobData: CleanupDeletedFilesJobData = {};

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<CleanupDeletedFilesJobData>;

      const result = await handleCleanupDeletedFiles(mockJob);

      expect(result).toEqual({
        deletedCount: 0,
        failedCount: 1,
        totalProcessed: 1,
        orgsUpdated: 1, // Storage is tracked before DB deletion, so org is counted even on failure
      });
    });
  });
});


