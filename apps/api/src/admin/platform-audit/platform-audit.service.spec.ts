import { Test, TestingModule } from '@nestjs/testing';
import { PlatformAuditService, PlatformAuditContext } from './platform-audit.service';
import { PlatformAuditRepository } from './platform-audit.repository';

describe('PlatformAuditService', () => {
  let service: PlatformAuditService;
  let repository: jest.Mocked<PlatformAuditRepository>;

  const mockContext: PlatformAuditContext = {
    actorId: 'admin-1',
    actorEmail: 'admin@example.com',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformAuditService,
        {
          provide: PlatformAuditRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PlatformAuditService>(PlatformAuditService);
    repository = module.get(PlatformAuditRepository);
  });

  describe('log', () => {
    it('should create a platform audit log entry', async () => {
      const event = {
        action: 'user.suspended',
        resourceType: 'user',
        resourceId: 'user-1',
        resourceName: 'user@example.com',
        metadata: { reason: 'Policy violation' },
      };

      await service.log(mockContext, event);

      expect(repository.create).toHaveBeenCalledWith({
        actorId: mockContext.actorId,
        actorEmail: mockContext.actorEmail,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        resourceName: event.resourceName,
        targetOrgId: null,
        targetOrgName: null,
        changes: null,
        metadata: event.metadata,
        ipAddress: mockContext.ipAddress,
        userAgent: mockContext.userAgent,
      });
    });

    it('should handle missing optional fields', async () => {
      const event = {
        action: 'test.action',
        resourceType: 'test',
      };

      await service.log(mockContext, event);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceId: null,
          resourceName: null,
          targetOrgId: null,
          targetOrgName: null,
          changes: null,
          metadata: null,
        }),
      );
    });

    it('should not throw on repository errors', async () => {
      repository.create.mockRejectedValue(new Error('Database error'));

      await expect(
        service.log(mockContext, {
          action: 'test.action',
          resourceType: 'test',
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('logUserSuspension', () => {
    it('should log user suspension with correct data', async () => {
      await service.logUserSuspension(mockContext, 'user-1', 'user@example.com', 'Spam');

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user.suspended',
          resourceType: 'user',
          resourceId: 'user-1',
          resourceName: 'user@example.com',
          metadata: { reason: 'Spam' },
        }),
      );
    });
  });

  describe('logUserUnsuspension', () => {
    it('should log user unsuspension with correct data', async () => {
      await service.logUserUnsuspension(mockContext, 'user-1', 'user@example.com');

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user.unsuspended',
          resourceType: 'user',
          resourceId: 'user-1',
          resourceName: 'user@example.com',
        }),
      );
    });
  });

  describe('logOrgSuspension', () => {
    it('should log organization suspension with correct data', async () => {
      await service.logOrgSuspension(mockContext, 'org-1', 'Acme Corp', 'Payment failure');

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'organization.suspended',
          resourceType: 'organization',
          resourceId: 'org-1',
          resourceName: 'Acme Corp',
          targetOrgId: 'org-1',
          targetOrgName: 'Acme Corp',
          metadata: { reason: 'Payment failure' },
        }),
      );
    });
  });

  describe('logOrgUnsuspension', () => {
    it('should log organization unsuspension with correct data', async () => {
      await service.logOrgUnsuspension(mockContext, 'org-1', 'Acme Corp');

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'organization.unsuspended',
          resourceType: 'organization',
          resourceId: 'org-1',
          resourceName: 'Acme Corp',
          targetOrgId: 'org-1',
          targetOrgName: 'Acme Corp',
        }),
      );
    });
  });

  describe('logFeatureFlagChange', () => {
    it('should log feature flag changes with before/after values', async () => {
      const changes = {
        before: { enabled: false },
        after: { enabled: true },
      };

      await service.logFeatureFlagChange(mockContext, 'flag-1', 'advanced-analytics', changes);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'feature_flag.updated',
          resourceType: 'feature_flag',
          resourceId: 'flag-1',
          resourceName: 'advanced-analytics',
          changes,
        }),
      );
    });
  });
});

