import { Test, TestingModule } from '@nestjs/testing';
import { MembersRepository } from './members.repository';
import { mockUUID } from '../../test/test-utils';

// Mock the @forgestack/db module
jest.mock('@forgestack/db', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  count: jest.fn(),
  withServiceContext: jest.fn(),
  users: {},
  organizationMembers: {},
}));

import { withServiceContext } from '@forgestack/db';

describe('MembersRepository', () => {
  let repository: MembersRepository;

  // Mock transaction object with chainable methods
  const createMockTx = () => ({
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    set: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MembersRepository],
    }).compile();

    repository = module.get<MembersRepository>(MembersRepository);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('findAllByOrgId', () => {
    it('should return paginated members with user info', async () => {
      const orgId = mockUUID();
      const mockTx = createMockTx();

      const mockMembers = [
        {
          userId: mockUUID(),
          role: 'OWNER' as const,
          joinedAt: new Date(),
          email: 'owner@example.com',
          name: 'Owner User',
        },
        {
          userId: mockUUID(),
          role: 'MEMBER' as const,
          joinedAt: new Date(),
          email: 'member@example.com',
          name: 'Member User',
        },
      ];

      // Mock count query
      mockTx.where.mockResolvedValueOnce([{ count: 2 }]);
      // Mock members query
      mockTx.offset.mockResolvedValueOnce(mockMembers);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.findAllByOrgId(orgId, { page: 1, limit: 10 });

      expect(result).toEqual({
        items: mockMembers,
        total: 2,
        page: 1,
        limit: 10,
      });
      expect(withServiceContext).toHaveBeenCalledWith(
        'MembersRepository.findAllByOrgId',
        expect.any(Function),
      );
    });

    it('should apply pagination correctly', async () => {
      const orgId = mockUUID();
      const mockTx = createMockTx();

      mockTx.where.mockResolvedValueOnce([{ count: 25 }]);
      mockTx.offset.mockResolvedValueOnce([]);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.findAllByOrgId(orgId, { page: 2, limit: 5 });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.total).toBe(25);
      expect(mockTx.limit).toHaveBeenCalledWith(5);
      expect(mockTx.offset).toHaveBeenCalledWith(5); // (page 2 - 1) * 5
    });

    it('should return empty result when no members found', async () => {
      const orgId = mockUUID();
      const mockTx = createMockTx();

      mockTx.where.mockResolvedValueOnce([{ count: 0 }]);
      mockTx.offset.mockResolvedValueOnce([]);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.findAllByOrgId(orgId);

      expect(result).toEqual({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('findByUserIdAndOrgId', () => {
    it('should return member with user info when found', async () => {
      const userId = mockUUID();
      const orgId = mockUUID();
      const mockTx = createMockTx();

      const mockMember = {
        userId,
        role: 'OWNER' as const,
        joinedAt: new Date(),
        email: 'user@example.com',
        name: 'Test User',
      };

      mockTx.limit.mockResolvedValueOnce([mockMember]);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.findByUserIdAndOrgId(userId, orgId);

      expect(result).toEqual(mockMember);
      expect(withServiceContext).toHaveBeenCalledWith(
        'MembersRepository.findByUserIdAndOrgId',
        expect.any(Function),
      );
    });

    it('should return null when member not found', async () => {
      const userId = mockUUID();
      const orgId = mockUUID();
      const mockTx = createMockTx();

      mockTx.limit.mockResolvedValueOnce([]);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.findByUserIdAndOrgId(userId, orgId);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new member', async () => {
      const orgId = mockUUID();
      const userId = mockUUID();
      const role = 'MEMBER' as const;
      const mockTx = createMockTx();

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      await repository.create(orgId, userId, role);

      expect(withServiceContext).toHaveBeenCalledWith(
        'MembersRepository.create',
        expect.any(Function),
      );
      expect(mockTx.insert).toHaveBeenCalled();
      expect(mockTx.values).toHaveBeenCalledWith({
        orgId,
        userId,
        role,
      });
    });
  });

  describe('updateRole', () => {
    it('should update member role', async () => {
      const orgId = mockUUID();
      const userId = mockUUID();
      const role = 'OWNER' as const;
      const mockTx = createMockTx();

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      await repository.updateRole(orgId, userId, role);

      expect(withServiceContext).toHaveBeenCalledWith(
        'MembersRepository.updateRole',
        expect.any(Function),
      );
      expect(mockTx.update).toHaveBeenCalled();
      expect(mockTx.set).toHaveBeenCalledWith({ role });
    });
  });

  describe('delete', () => {
    it('should delete a member', async () => {
      const orgId = mockUUID();
      const userId = mockUUID();
      const mockTx = createMockTx();

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      await repository.delete(orgId, userId);

      expect(withServiceContext).toHaveBeenCalledWith(
        'MembersRepository.delete',
        expect.any(Function),
      );
      expect(mockTx.delete).toHaveBeenCalled();
    });
  });

  describe('countOwners', () => {
    it('should return count of OWNER members', async () => {
      const orgId = mockUUID();
      const mockTx = createMockTx();

      mockTx.where.mockResolvedValueOnce([{ count: 3 }]);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.countOwners(orgId);

      expect(result).toBe(3);
      expect(withServiceContext).toHaveBeenCalledWith(
        'MembersRepository.countOwners',
        expect.any(Function),
      );
    });

    it('should return 0 when no owners found', async () => {
      const orgId = mockUUID();
      const mockTx = createMockTx();

      mockTx.where.mockResolvedValueOnce([{ count: 0 }]);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.countOwners(orgId);

      expect(result).toBe(0);
    });
  });
});

