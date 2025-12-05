import { FilesRepository } from './files.repository';

// Mock the database module
jest.mock('@forgestack/db', () => ({
  withTenantContext: jest.fn((ctx, fn) => fn(mockDb)),
  withServiceContext: jest.fn((reason, fn) => fn(mockDb)),
  files: {
    id: 'id',
    orgId: 'orgId',
    userId: 'userId',
    bucket: 'bucket',
    key: 'key',
    filename: 'filename',
    contentType: 'contentType',
    size: 'size',
    purpose: 'purpose',
    entityType: 'entityType',
    entityId: 'entityId',
    uploadedAt: 'uploadedAt',
    createdAt: 'createdAt',
    deletedAt: 'deletedAt',
  },
  eq: jest.fn(),
  and: jest.fn(),
  desc: jest.fn(),
  count: jest.fn(),
  isNull: jest.fn(),
  isNotNull: jest.fn(),
  lt: jest.fn(),
}));

const mockDb = {
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([]),
};

import type { OrgRole } from '@forgestack/shared';

interface TenantContext {
  orgId: string;
  userId: string;
  role: OrgRole;
}

describe('FilesRepository', () => {
  let repository: FilesRepository;
  let ctx: TenantContext;

  beforeEach(() => {
    repository = new FilesRepository();
    ctx = {
      orgId: 'org-123',
      userId: 'user-123',
      role: 'OWNER',
    };
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a file record', async () => {
      const fileData = {
        bucket: 'test-bucket',
        key: 'org-123/avatar/123456-avatar.jpg',
        filename: 'avatar.jpg',
        contentType: 'image/jpeg',
        size: 1024,
        purpose: 'avatar',
        uploadedAt: null,
      };

      const mockFile = {
        id: 'file-123',
        ...fileData,
        orgId: ctx.orgId,
        userId: ctx.userId,
        entityType: null,
        entityId: null,
        createdAt: new Date(),
        deletedAt: null,
      };

      mockDb.returning.mockResolvedValueOnce([mockFile]);

      const result = await repository.create(ctx, fileData);

      expect(result).toEqual(mockFile);
    });
  });

  describe('findById', () => {
    it('should find a file by ID', async () => {
      const mockFile = {
        id: 'file-123',
        orgId: ctx.orgId,
        userId: ctx.userId,
        bucket: 'test-bucket',
        key: 'org-123/avatar/123456-avatar.jpg',
        filename: 'avatar.jpg',
        contentType: 'image/jpeg',
        size: 1024,
        purpose: 'avatar',
        entityType: null,
        entityId: null,
        uploadedAt: new Date(),
        createdAt: new Date(),
        deletedAt: null,
      };

      mockDb.where.mockResolvedValueOnce([mockFile]);

      const result = await repository.findById(ctx, 'file-123');

      expect(result).toEqual(mockFile);
    });

    it('should return null if file not found', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      const result = await repository.findById(ctx, 'non-existent');

      expect(result).toBeNull();
    });
  });
});

