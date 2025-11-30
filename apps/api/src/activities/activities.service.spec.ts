import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesService } from './activities.service';
import { ActivitiesRepository } from './activities.repository';
import { QueueService } from '../queue/queue.service';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let repository: jest.Mocked<ActivitiesRepository>;
  let queueService: jest.Mocked<QueueService>;

  const mockTenantContext = {
    orgId: 'org-123',
    userId: 'user-123',
    role: 'OWNER' as const,
  };

  beforeEach(async () => {
    const mockRepository = {
      findAll: jest.fn(),
      findRecent: jest.fn(),
    };

    const mockQueueService = {
      addJob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: ActivitiesRepository,
          useValue: mockRepository,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
    repository = module.get(ActivitiesRepository);
    queueService = module.get(QueueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should queue activity event successfully', async () => {
      const event = {
        orgId: 'org-123',
        actorId: 'user-123',
        type: 'project.created',
        title: 'created project "Test Project"',
        resourceType: 'project',
        resourceId: 'project-123',
        resourceName: 'Test Project',
      };

      queueService.addJob.mockResolvedValueOnce({} as never);

      await service.create(event);

      expect(queueService.addJob).toHaveBeenCalledWith('activities', event, { delay: 0 });
    });

    it('should not throw if queue fails', async () => {
      const event = {
        orgId: 'org-123',
        actorId: 'user-123',
        type: 'project.created',
        title: 'created project "Test Project"',
      };

      queueService.addJob.mockRejectedValueOnce(new Error('Queue error'));

      await expect(service.create(event)).resolves.not.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return paginated activities', async () => {
      const mockActivities = [
        {
          id: 'activity-1',
          orgId: 'org-123',
          actorId: 'user-123',
          actorName: 'John Doe',
          actorAvatar: null,
          type: 'project.created',
          title: 'created project "Test"',
          description: null,
          resourceType: 'project',
          resourceId: 'project-123',
          resourceName: 'Test',
          metadata: null,
          aggregationKey: null,
          aggregationCount: 1,
          createdAt: new Date(),
        },
      ];

      repository.findAll.mockResolvedValueOnce({
        items: mockActivities,
        total: 1,
        hasMore: false,
        nextCursor: undefined,
      });

      const result = await service.findAll(mockTenantContext, { limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('activity-1');
      expect(result.pagination.hasMore).toBe(false);
      expect(repository.findAll).toHaveBeenCalledWith(mockTenantContext, { limit: 20 });
    });
  });

  describe('findRecent', () => {
    it('should return recent activities', async () => {
      const mockActivities = [
        {
          id: 'activity-1',
          orgId: 'org-123',
          actorId: 'user-123',
          actorName: 'John Doe',
          actorAvatar: null,
          type: 'project.created',
          title: 'created project "Test"',
          description: null,
          resourceType: 'project',
          resourceId: 'project-123',
          resourceName: 'Test',
          metadata: null,
          aggregationKey: null,
          aggregationCount: 1,
          createdAt: new Date(),
        },
      ];

      repository.findRecent.mockResolvedValueOnce(mockActivities);

      const result = await service.findRecent(mockTenantContext, 10);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('activity-1');
      expect(repository.findRecent).toHaveBeenCalledWith(mockTenantContext, 10);
    });
  });
});

