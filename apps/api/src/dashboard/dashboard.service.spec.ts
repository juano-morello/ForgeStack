import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { ProjectsRepository } from '../projects/projects.repository';
import { MembersRepository } from '../members/members.repository';
import { ApiKeysRepository } from '../api-keys/api-keys.repository';
import { ActivitiesRepository } from '../activities/activities.repository';
import { FilesRepository } from '../files/files.repository';
import { BillingService } from '../billing/billing.service';
import { UsageService } from '../usage/usage.service';
import type { TenantContext } from '@forgestack/db';

describe('DashboardService', () => {
  let service: DashboardService;
  let projectsRepository: jest.Mocked<ProjectsRepository>;
  let membersRepository: jest.Mocked<MembersRepository>;
  let apiKeysRepository: jest.Mocked<ApiKeysRepository>;
  let activitiesRepository: jest.Mocked<ActivitiesRepository>;
  let filesRepository: jest.Mocked<FilesRepository>;
  let billingService: jest.Mocked<BillingService>;
  let usageService: jest.Mocked<UsageService>;

  const mockTenantContext: TenantContext = {
    orgId: 'org-123',
    userId: 'user-123',
    role: 'MEMBER',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: ProjectsRepository,
          useValue: {
            count: jest.fn(),
            findRecent: jest.fn(),
          },
        },
        {
          provide: MembersRepository,
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: ApiKeysRepository,
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: ActivitiesRepository,
          useValue: {
            findRecent: jest.fn(),
          },
        },
        {
          provide: FilesRepository,
          useValue: {
            getStorageUsed: jest.fn(),
          },
        },
        {
          provide: BillingService,
          useValue: {
            getSubscription: jest.fn(),
          },
        },
        {
          provide: UsageService,
          useValue: {
            getCurrentUsage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    projectsRepository = module.get(ProjectsRepository);
    membersRepository = module.get(MembersRepository);
    apiKeysRepository = module.get(ApiKeysRepository);
    activitiesRepository = module.get(ActivitiesRepository);
    filesRepository = module.get(FilesRepository);
    billingService = module.get(BillingService);
    usageService = module.get(UsageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSummary', () => {
    it('should return dashboard summary with stats and recent data', async () => {
      // Arrange
      const mockProjects = [{
        id: 'p1',
        name: 'Project 1',
        orgId: 'org-123',
        createdAt: new Date(),
        description: 'Test project',
        updatedAt: new Date(),
      }];
      const mockActivities = [{
        id: 'a1',
        createdAt: new Date(),
        orgId: 'org-123',
        description: 'Created project',
        actorId: 'user-123',
        actorName: 'Test User',
        actorAvatar: null,
        type: 'project.created',
        title: 'Project Created',
        resourceType: 'project',
        resourceId: 'p1',
        resourceName: 'Project 1',
        metadata: null,
        aggregationKey: null,
        aggregationCount: 1,
      }];

      projectsRepository.count.mockResolvedValue(5);
      membersRepository.count.mockResolvedValue(3);
      apiKeysRepository.count.mockResolvedValue(2);
      activitiesRepository.findRecent.mockResolvedValue(mockActivities);
      projectsRepository.findRecent.mockResolvedValue(mockProjects);
      filesRepository.getStorageUsed.mockResolvedValue(1024000);

      // Act
      const result = await service.getSummary(mockTenantContext);

      // Assert
      expect(result).toEqual({
        stats: {
          projects: 5,
          members: 3,
          apiKeys: 2,
          storageUsedBytes: 1024000,
        },
        recentActivity: mockActivities,
        recentProjects: mockProjects,
      });
      expect(projectsRepository.count).toHaveBeenCalledWith(mockTenantContext);
      expect(membersRepository.count).toHaveBeenCalledWith('org-123');
      expect(apiKeysRepository.count).toHaveBeenCalledWith(mockTenantContext);
      expect(activitiesRepository.findRecent).toHaveBeenCalledWith(mockTenantContext, 5);
      expect(projectsRepository.findRecent).toHaveBeenCalledWith(mockTenantContext, 5);
      expect(filesRepository.getStorageUsed).toHaveBeenCalledWith('org-123');
    });

    it('should include orgHealth for OWNER role', async () => {
      // Arrange
      const ownerContext: TenantContext = {
        ...mockTenantContext,
        role: 'OWNER',
      };

      const mockSubscription = {
        plan: 'pro',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
      };

      const mockUsage = {
        billingPeriod: {
          start: new Date(),
          end: new Date(),
        },
        usage: {
          apiCalls: { used: 1000, limit: 10000, percentUsed: 10 },
          storage: { usedBytes: 1024000, limitBytes: 10737418240, percentUsed: 0.95 },
          seats: { active: 3, limit: 10, percentUsed: 30 },
        },
      };

      projectsRepository.count.mockResolvedValue(5);
      membersRepository.count.mockResolvedValue(3);
      apiKeysRepository.count.mockResolvedValue(2);
      activitiesRepository.findRecent.mockResolvedValue([]);
      projectsRepository.findRecent.mockResolvedValue([]);
      filesRepository.getStorageUsed.mockResolvedValue(1024000);
      billingService.getSubscription.mockResolvedValue(mockSubscription);
      usageService.getCurrentUsage.mockResolvedValue(mockUsage);

      // Act
      const result = await service.getSummary(ownerContext);

      // Assert
      expect(result.orgHealth).toBeDefined();
      expect(result.orgHealth).toEqual({
        subscriptionStatus: 'active',
        usageSummary: mockUsage.usage,
      });
      expect(billingService.getSubscription).toHaveBeenCalledWith(ownerContext);
      expect(usageService.getCurrentUsage).toHaveBeenCalledWith(ownerContext);
    });

    it('should NOT include orgHealth for MEMBER role', async () => {
      // Arrange
      projectsRepository.count.mockResolvedValue(5);
      membersRepository.count.mockResolvedValue(3);
      apiKeysRepository.count.mockResolvedValue(2);
      activitiesRepository.findRecent.mockResolvedValue([]);
      projectsRepository.findRecent.mockResolvedValue([]);
      filesRepository.getStorageUsed.mockResolvedValue(1024000);

      // Act
      const result = await service.getSummary(mockTenantContext);

      // Assert
      expect(result.orgHealth).toBeUndefined();
      expect(billingService.getSubscription).not.toHaveBeenCalled();
      expect(usageService.getCurrentUsage).not.toHaveBeenCalled();
    });

    it('should handle errors in orgHealth gracefully', async () => {
      // Arrange
      const ownerContext: TenantContext = {
        ...mockTenantContext,
        role: 'OWNER',
      };

      projectsRepository.count.mockResolvedValue(5);
      membersRepository.count.mockResolvedValue(3);
      apiKeysRepository.count.mockResolvedValue(2);
      activitiesRepository.findRecent.mockResolvedValue([]);
      projectsRepository.findRecent.mockResolvedValue([]);
      filesRepository.getStorageUsed.mockResolvedValue(1024000);
      billingService.getSubscription.mockRejectedValue(new Error('Billing service error'));

      // Act
      const result = await service.getSummary(ownerContext);

      // Assert
      expect(result.orgHealth).toBeNull();
      expect(result.stats).toBeDefined();
    });

    it('should return zero counts when no data exists', async () => {
      // Arrange
      projectsRepository.count.mockResolvedValue(0);
      membersRepository.count.mockResolvedValue(0);
      apiKeysRepository.count.mockResolvedValue(0);
      activitiesRepository.findRecent.mockResolvedValue([]);
      projectsRepository.findRecent.mockResolvedValue([]);
      filesRepository.getStorageUsed.mockResolvedValue(0);

      // Act
      const result = await service.getSummary(mockTenantContext);

      // Assert
      expect(result.stats).toEqual({
        projects: 0,
        members: 0,
        apiKeys: 0,
        storageUsedBytes: 0,
      });
      expect(result.recentActivity).toEqual([]);
      expect(result.recentProjects).toEqual([]);
    });
  });
});

