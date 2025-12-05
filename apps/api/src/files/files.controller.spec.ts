import { Test, TestingModule } from '@nestjs/testing';

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

import { FilesController } from './files.controller';
import { FilesService } from './files.service';

import type { OrgRole } from '@forgestack/shared';

interface TenantContext {
  orgId: string;
  userId: string;
  role: OrgRole;
}

describe('FilesController', () => {
  let controller: FilesController;
  let service: jest.Mocked<FilesService>;
  let ctx: TenantContext;

  beforeEach(async () => {
    const mockService = {
      getPresignedUploadUrl: jest.fn(),
      completeUpload: jest.fn(),
      getFile: jest.fn(),
      deleteFile: jest.fn(),
      listFiles: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
    service = module.get(FilesService) as jest.Mocked<FilesService>;
    ctx = {
      orgId: 'org-123',
      userId: 'user-123',
      role: 'OWNER',
    };
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPresignedUrl', () => {
    it('should return presigned URL response', async () => {
      const dto = {
        filename: 'avatar.jpg',
        contentType: 'image/jpeg',
        size: 1024 * 1024,
        purpose: 'avatar',
      };

      const mockResponse = {
        fileId: 'file-123',
        uploadUrl: 'https://upload-url.com',
        expiresAt: new Date().toISOString(),
      };

      service.getPresignedUploadUrl.mockResolvedValue(mockResponse);

      const result = await controller.getPresignedUrl(dto, ctx);

      expect(result).toEqual(mockResponse);
      expect(service.getPresignedUploadUrl).toHaveBeenCalledWith(ctx, dto);
    });
  });

  describe('completeUpload', () => {
    it('should complete upload and return response', async () => {
      const fileId = 'file-123';
      const mockResponse = {
        id: fileId,
        url: 'https://download-url.com',
      };

      service.completeUpload.mockResolvedValue(mockResponse);

      const result = await controller.completeUpload(fileId, ctx);

      expect(result).toEqual(mockResponse);
      expect(service.completeUpload).toHaveBeenCalledWith(ctx, fileId);
    });
  });

  describe('getFile', () => {
    it('should return file metadata with download URL', async () => {
      const fileId = 'file-123';
      const mockFile = {
        id: fileId,
        filename: 'avatar.jpg',
        contentType: 'image/jpeg',
        size: 1024,
        purpose: 'avatar',
        url: 'https://download-url.com',
        createdAt: new Date().toISOString(),
      };

      service.getFile.mockResolvedValue(mockFile);

      const result = await controller.getFile(fileId, ctx);

      expect(result).toEqual(mockFile);
      expect(service.getFile).toHaveBeenCalledWith(ctx, fileId);
    });
  });

  describe('deleteFile', () => {
    it('should delete file and return success response', async () => {
      const fileId = 'file-123';
      const mockResponse = {
        success: true,
        message: 'File deleted successfully',
      };

      service.deleteFile.mockResolvedValue(mockResponse);

      const result = await controller.deleteFile(fileId, ctx);

      expect(result).toEqual(mockResponse);
      expect(service.deleteFile).toHaveBeenCalledWith(ctx, fileId);
    });
  });

  describe('listFiles', () => {
    it('should return paginated files', async () => {
      const query = {
        purpose: 'avatar',
        page: 1,
        limit: 10,
      };

      const mockResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      service.listFiles.mockResolvedValue(mockResponse);

      const result = await controller.listFiles(query, ctx);

      expect(result).toEqual(mockResponse);
      expect(service.listFiles).toHaveBeenCalledWith(ctx, query);
    });
  });
});

