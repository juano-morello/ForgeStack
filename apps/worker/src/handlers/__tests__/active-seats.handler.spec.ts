/**
 * Active Seats Handler Tests
 */

import { Job } from 'bullmq';
import { handleActiveSeats, ActiveSeatsJobData } from '../active-seats.handler';
import { withServiceContext } from '@forgestack/db';

// Mock database context
jest.mock('@forgestack/db', () => ({
  withServiceContext: jest.fn(),
  usageRecords: {},
  organizationMembers: {},
  organizations: {},
  eq: jest.fn(),
  and: jest.fn(),
  sql: jest.fn(),
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

describe('ActiveSeatsHandler', () => {
  const mockWithServiceContext = withServiceContext as jest.MockedFunction<typeof withServiceContext>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleActiveSeats', () => {
    it('should calculate active seats for all organizations', async () => {
      const mockOrgs = [
        { id: 'org-1' },
        { id: 'org-2' },
      ];

      let callCount = 0;
      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        callCount++;
        
        // First call: get organizations
        if (callCount === 1) {
          return callback({ select: () => ({ from: () => mockOrgs }) } as unknown as Parameters<typeof callback>[0]);
        }

        // Second call: count members for org-1
        if (callCount === 2) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => [{ count: 5 }],
              }),
            }),
          } as unknown as Parameters<typeof callback>[0]);
        }

        // Third call: upsert record for org-1
        if (callCount === 3) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => ({
                  limit: () => [],
                }),
              }),
            }),
            insert: () => ({
              values: jest.fn().mockResolvedValue(undefined),
            }),
          } as unknown as Parameters<typeof callback>[0]);
        }

        // Fourth call: count members for org-2
        if (callCount === 4) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => [{ count: 3 }],
              }),
            }),
          } as unknown as Parameters<typeof callback>[0]);
        }

        // Fifth call: upsert record for org-2
        if (callCount === 5) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => ({
                  limit: () => [],
                }),
              }),
            }),
            insert: () => ({
              values: jest.fn().mockResolvedValue(undefined),
            }),
          } as unknown as Parameters<typeof callback>[0]);
        }

        return callback({} as unknown as Parameters<typeof callback>[0]);
      });

      const jobData: ActiveSeatsJobData = {};
      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<ActiveSeatsJobData>;

      const result = await handleActiveSeats(mockJob);

      expect(result).toEqual({
        success: true,
        date: expect.any(String),
        processedOrgs: 2,
      });
    });

    it('should use specified date when provided', async () => {
      const mockOrgs: { id: string }[] = [];

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        return callback({ select: () => ({ from: () => mockOrgs }) } as unknown as Parameters<typeof callback>[0]);
      });

      const jobData: ActiveSeatsJobData = {
        date: '2024-01-15',
      };
      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<ActiveSeatsJobData>;

      const result = await handleActiveSeats(mockJob);

      expect(result).toEqual({
        success: true,
        date: '2024-01-15',
        processedOrgs: 0,
      });
    });

    it('should update existing usage record', async () => {
      const mockOrgs = [{ id: 'org-1' }];
      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);

      let callCount = 0;
      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        callCount++;
        
        if (callCount === 1) {
          return callback({ select: () => ({ from: () => mockOrgs }) } as unknown as Parameters<typeof callback>[0]);
        }

        if (callCount === 2) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => [{ count: 5 }],
              }),
            }),
          } as unknown as Parameters<typeof callback>[0]);
        }

        if (callCount === 3) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => ({
                  limit: () => [{ id: 'existing-record' }],
                }),
              }),
            }),
            update: mockUpdate,
          } as unknown as Parameters<typeof callback>[0]);
        }

        return callback({} as unknown as Parameters<typeof callback>[0]);
      });

      mockUpdate.mockReturnValue({ set: mockSet });
      mockSet.mockReturnValue({ where: mockWhere });

      const jobData: ActiveSeatsJobData = {};
      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<ActiveSeatsJobData>;

      const result = await handleActiveSeats(mockJob);

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith({
        quantity: 5,
        updatedAt: expect.any(Date),
      });
    });

    it('should handle errors for individual orgs and continue', async () => {
      const mockOrgs = [
        { id: 'org-1' },
        { id: 'org-2' },
      ];

      let callCount = 0;
      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        callCount++;

        if (callCount === 1) {
          return callback({ select: () => ({ from: () => mockOrgs }) } as unknown as Parameters<typeof callback>[0]);
        }

        // Fail for org-1
        if (callCount === 2) {
          throw new Error('Database error');
        }

        // Succeed for org-2
        if (callCount === 3) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => [{ count: 3 }],
              }),
            }),
          } as unknown as Parameters<typeof callback>[0]);
        }

        if (callCount === 4) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => ({
                  limit: () => [],
                }),
              }),
            }),
            insert: () => ({
              values: jest.fn().mockResolvedValue(undefined),
            }),
          } as unknown as Parameters<typeof callback>[0]);
        }

        return callback({} as unknown as Parameters<typeof callback>[0]);
      });

      const jobData: ActiveSeatsJobData = {};
      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<ActiveSeatsJobData>;

      const result = await handleActiveSeats(mockJob);

      expect(result).toEqual({
        success: true,
        date: expect.any(String),
        processedOrgs: 1, // Only org-2 succeeded
      });
    });

    it('should throw error if getting organizations fails', async () => {
      mockWithServiceContext.mockRejectedValue(new Error('Database connection failed'));

      const jobData: ActiveSeatsJobData = {};
      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<ActiveSeatsJobData>;

      await expect(handleActiveSeats(mockJob)).rejects.toThrow('Database connection failed');
    });
  });
});
