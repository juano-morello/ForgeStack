import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

// Mock the database module before importing anything else
jest.mock('@forgestack/db', () => ({
  withTenantContext: jest.fn(),
  withServiceContext: jest.fn(),
  files: {},
  eq: jest.fn(),
  and: jest.fn(),
  desc: jest.fn(),
  count: jest.fn(),
  isNull: jest.fn(),
  isNotNull: jest.fn(),
  lt: jest.fn(),
}));

import { FilesService } from './files.service';
import { FilesRepository } from './files.repository';
import { StorageService } from './storage.service';
import { ActivitiesService } from '../activities/activities.service';

import type { OrgRole } from '@forgestack/shared';

interface TenantContext {
  orgId: string;
  userId: string;
  role: OrgRole;
}

describe('FilesService', () => {
  let service: FilesService;
  let repository: jest.Mocked<FilesRepository>;
  let storageService: jest.Mocked<StorageService>;
  let ctx: TenantContext;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEntity: jest.fn(),
      findAll: jest.fn(),
      markUploaded: jest.fn(),
      softDelete: jest.fn(),
      findPreviousFile: jest.fn(),
    };

    const mockStorageService = {
      generateKey: jest.fn(),
      getPresignedUploadUrl: jest.fn(),
      getPresignedDownloadUrl: jest.fn(),
      deleteFile: jest.fn(),
      getBucket: jest.fn().mockReturnValue('test-bucket'),
    };

    const mockActivitiesService = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: FilesRepository,
          useValue: mockRepository,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: ActivitiesService,
          useValue: mockActivitiesService,
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    repository = module.get(FilesRepository) as jest.Mocked<FilesRepository>;
    storageService = module.get(StorageService) as jest.Mocked<StorageService>;
    ctx = {
      orgId: 'org-123',
      userId: 'user-123',
      role: 'OWNER',
    };
  });

  describe('getPresignedUploadUrl', () => {
    it('should generate presigned URL for valid avatar upload', async () => {
      const dto = {
        filename: 'avatar.jpg',
        contentType: 'image/jpeg',
        size: 1024 * 1024, // 1MB
        purpose: 'avatar',
      };

      const mockFile = {
        id: 'file-123',
        orgId: ctx.orgId,
        userId: ctx.userId,
        bucket: 'test-bucket',
        key: 'org-123/avatar/123456-avatar.jpg',
        filename: dto.filename,
        contentType: dto.contentType,
        size: dto.size,
        purpose: dto.purpose,
        entityType: null,
        entityId: null,
        uploadedAt: null,
        createdAt: new Date(),
        deletedAt: null,
      };

      storageService.generateKey.mockReturnValue(mockFile.key);
      repository.create.mockResolvedValue(mockFile);
      storageService.getPresignedUploadUrl.mockResolvedValue('https://upload-url.com');

      const result = await service.getPresignedUploadUrl(ctx, dto);

      expect(result).toEqual({
        fileId: mockFile.id,
        uploadUrl: 'https://upload-url.com',
        expiresAt: expect.any(String),
      });
      expect(repository.create).toHaveBeenCalled();
      expect(storageService.getPresignedUploadUrl).toHaveBeenCalledWith(mockFile.key, dto.contentType, 900);
    });

    it('should reject file exceeding size limit', async () => {
      const dto = {
        filename: 'large.jpg',
        contentType: 'image/jpeg',
        size: 10 * 1024 * 1024, // 10MB (exceeds 5MB limit for avatar)
        purpose: 'avatar',
      };

      await expect(service.getPresignedUploadUrl(ctx, dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid content type', async () => {
      const dto = {
        filename: 'file.pdf',
        contentType: 'application/pdf',
        size: 1024 * 1024,
        purpose: 'avatar',
      };

      await expect(service.getPresignedUploadUrl(ctx, dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject malformed content type format', async () => {
      const dto = {
        filename: 'file.jpg',
        contentType: 'invalid-content-type!@#',
        size: 1024 * 1024,
        purpose: 'avatar',
      };

      await expect(service.getPresignedUploadUrl(ctx, dto)).rejects.toThrow(BadRequestException);
      await expect(service.getPresignedUploadUrl(ctx, dto)).rejects.toThrow('Invalid content type format');
    });

    it('should reject empty content type', async () => {
      const dto = {
        filename: 'file.jpg',
        contentType: '',
        size: 1024 * 1024,
        purpose: 'avatar',
      };

      await expect(service.getPresignedUploadUrl(ctx, dto)).rejects.toThrow(BadRequestException);
      await expect(service.getPresignedUploadUrl(ctx, dto)).rejects.toThrow('Invalid content type format');
    });

    it('should require entityType and entityId for attachments', async () => {
      const dto = {
        filename: 'doc.pdf',
        contentType: 'application/pdf',
        size: 1024 * 1024,
        purpose: 'attachment',
      };

      await expect(service.getPresignedUploadUrl(ctx, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeUpload', () => {
    it('should mark upload as complete and return download URL', async () => {
      const fileId = 'file-123';
      const mockFile = {
        id: fileId,
        key: 'org-123/avatar/123456-avatar.jpg',
        purpose: 'avatar',
        entityType: null,
        entityId: null,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repository.markUploaded.mockResolvedValue(mockFile as any);
      repository.findPreviousFile.mockResolvedValue(null);
      storageService.getPresignedDownloadUrl.mockResolvedValue('https://download-url.com');

      const result = await service.completeUpload(ctx, fileId);

      expect(result).toEqual({
        id: fileId,
        url: 'https://download-url.com',
      });
      expect(repository.markUploaded).toHaveBeenCalledWith(ctx, fileId);
    });
  });
});

