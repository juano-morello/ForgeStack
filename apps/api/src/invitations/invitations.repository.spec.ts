import { Test, TestingModule } from '@nestjs/testing';
import { InvitationsRepository } from './invitations.repository';
import { createMockInvitation, mockUUID } from '../../test/test-utils';

// Mock the @forgestack/db module
jest.mock('@forgestack/db', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  gt: jest.fn(),
  lt: jest.fn(),
  count: jest.fn(),
  withServiceContext: jest.fn(),
  invitations: {},
}));

import { gt, lt, withServiceContext } from '@forgestack/db';

describe('InvitationsRepository', () => {
  let repository: InvitationsRepository;

  // Mock transaction object with chainable methods
  const createMockTx = () => ({
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvitationsRepository],
    }).compile();

    repository = module.get<InvitationsRepository>(InvitationsRepository);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create invitation with all fields', async () => {
      const orgId = mockUUID();
      const email = 'test@example.com';
      const role = 'MEMBER' as const;
      const token = 'a'.repeat(64);
      const expiresAt = new Date();
      const mockInvitation = createMockInvitation({
        orgId,
        email,
        role,
        token,
        expiresAt,
      });
      const mockTx = createMockTx();

      mockTx.returning.mockResolvedValueOnce([mockInvitation]);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.create(orgId, email, role, token, expiresAt);

      expect(result).toEqual(mockInvitation);
      expect(withServiceContext).toHaveBeenCalledWith(
        'InvitationsRepository.create',
        expect.any(Function),
      );
      expect(mockTx.insert).toHaveBeenCalled();
      expect(mockTx.values).toHaveBeenCalledWith({
        orgId,
        email,
        role,
        token,
        expiresAt,
      });
    });
  });

  describe('findByOrgId', () => {
    it('should return only non-expired invitations', async () => {
      const orgId = mockUUID();
      const mockInvitation = createMockInvitation({ orgId });

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        // Create a fresh mock for each query
        const mockTx1 = createMockTx();
        const mockTx2 = createMockTx();

        // First query (items)
        mockTx1.offset.mockResolvedValueOnce([mockInvitation]);

        // Second query (count)
        mockTx2.where.mockResolvedValueOnce([{ count: 1 }]);

        // Track which query we're on
        let queryCount = 0;
        const txProxy = new Proxy(mockTx1, {
          get(target, prop) {
            if (prop === 'select') {
              queryCount++;
              return queryCount === 1 ? target.select : mockTx2.select;
            }
            return queryCount === 1 ? target[prop] : mockTx2[prop];
          },
        });

        return callback(txProxy);
      });

      const result = await repository.findByOrgId(orgId);

      expect(result.items).toEqual([mockInvitation]);
      expect(result.total).toBe(1);
      expect(gt).toHaveBeenCalled(); // Verify expiry check
    });

    it('should apply pagination correctly', async () => {
      const orgId = mockUUID();
      const mockInvitations = [
        createMockInvitation({ orgId }),
        createMockInvitation({ orgId }),
      ];

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        // Create a fresh mock for each query
        const mockTx1 = createMockTx();
        const mockTx2 = createMockTx();

        // First query (items)
        mockTx1.offset.mockResolvedValueOnce(mockInvitations);

        // Second query (count)
        mockTx2.where.mockResolvedValueOnce([{ count: 5 }]);

        // Track which query we're on
        let queryCount = 0;
        const txProxy = new Proxy(mockTx1, {
          get(target, prop) {
            if (prop === 'select') {
              queryCount++;
              return queryCount === 1 ? target.select : mockTx2.select;
            }
            return queryCount === 1 ? target[prop] : mockTx2[prop];
          },
        });

        return callback(txProxy);
      });

      const result = await repository.findByOrgId(orgId, { page: 2, limit: 2 });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(2);
    });
  });

  describe('findById', () => {
    it('should return invitation when found', async () => {
      const id = mockUUID();
      const mockInvitation = createMockInvitation({ id });
      const mockTx = createMockTx();

      mockTx.where.mockResolvedValueOnce([mockInvitation]);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.findById(id);

      expect(result).toEqual(mockInvitation);
      expect(withServiceContext).toHaveBeenCalledWith(
        'InvitationsRepository.findById',
        expect.any(Function),
      );
    });

    it('should return null when not found', async () => {
      const id = mockUUID();
      const mockTx = createMockTx();

      mockTx.where.mockResolvedValueOnce([]);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.findById(id);

      expect(result).toBeNull();
    });
  });

  describe('findByToken', () => {
    it('should return invitation when found', async () => {
      const token = 'a'.repeat(64);
      const mockInvitation = createMockInvitation({ token });
      const mockTx = createMockTx();

      mockTx.where.mockResolvedValueOnce([mockInvitation]);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.findByToken(token);

      expect(result).toEqual(mockInvitation);
      expect(withServiceContext).toHaveBeenCalledWith(
        'InvitationsRepository.findByToken',
        expect.any(Function),
      );
    });

    it('should return null when not found', async () => {
      const token = 'invalid-token';
      const mockTx = createMockTx();

      mockTx.where.mockResolvedValueOnce([]);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.findByToken(token);

      expect(result).toBeNull();
    });
  });

  describe('findByEmailAndOrg', () => {
    it('should return pending invitation when found', async () => {
      const email = 'test@example.com';
      const orgId = mockUUID();
      const mockInvitation = createMockInvitation({ email, orgId });
      const mockTx = createMockTx();

      mockTx.where.mockResolvedValueOnce([mockInvitation]);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.findByEmailAndOrg(email, orgId);

      expect(result).toEqual(mockInvitation);
      expect(withServiceContext).toHaveBeenCalledWith(
        'InvitationsRepository.findByEmailAndOrg',
        expect.any(Function),
      );
      expect(gt).toHaveBeenCalled(); // Verify expiry check
    });

    it('should return null when not found', async () => {
      const email = 'test@example.com';
      const orgId = mockUUID();
      const mockTx = createMockTx();

      mockTx.where.mockResolvedValueOnce([]);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.findByEmailAndOrg(email, orgId);

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete and return true when successful', async () => {
      const id = mockUUID();
      const mockInvitation = createMockInvitation({ id });
      const mockTx = createMockTx();

      mockTx.returning.mockResolvedValueOnce([mockInvitation]);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.delete(id);

      expect(result).toBe(true);
      expect(withServiceContext).toHaveBeenCalledWith(
        'InvitationsRepository.delete',
        expect.any(Function),
      );
    });

    it('should return false when invitation not found', async () => {
      const id = mockUUID();
      const mockTx = createMockTx();

      mockTx.returning.mockResolvedValueOnce([]);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.delete(id);

      expect(result).toBe(false);
    });
  });

  describe('deleteExpired', () => {
    it('should delete expired invitations and return count', async () => {
      const mockInvitations = [createMockInvitation(), createMockInvitation()];
      const mockTx = createMockTx();

      mockTx.returning.mockResolvedValueOnce(mockInvitations);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.deleteExpired();

      expect(result).toBe(2);
      expect(withServiceContext).toHaveBeenCalledWith(
        'InvitationsRepository.deleteExpired',
        expect.any(Function),
      );
      expect(lt).toHaveBeenCalled(); // Verify expiry check
    });
  });
});

