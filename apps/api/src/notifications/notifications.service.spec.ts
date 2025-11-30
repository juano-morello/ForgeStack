import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { QueueService } from '../queue/queue.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: jest.Mocked<NotificationsRepository>;
  let queueService: jest.Mocked<QueueService>;

  const mockUserId = 'user-123';
  const mockOrgId = 'org-123';

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      getUnreadCount: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      delete: jest.fn(),
      getPreferences: jest.fn(),
      getPreference: jest.fn(),
      upsertPreference: jest.fn(),
    };

    const mockQueueService = {
      addJob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NotificationsRepository,
          useValue: mockRepository,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repository = module.get(NotificationsRepository);
    queueService = module.get(QueueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('send', () => {
    it('should create in-app notification and queue email for high priority notification', async () => {
      const event = {
        userId: mockUserId,
        orgId: mockOrgId,
        type: 'member.role_changed',
        title: 'Role Updated',
        body: 'Your role has been changed',
        link: '/settings',
      };

      repository.getPreference.mockResolvedValueOnce(null);
      repository.create.mockResolvedValueOnce({
        id: 'notif-123',
        userId: mockUserId,
        orgId: mockOrgId,
        type: event.type,
        title: event.title,
        body: event.body,
        link: event.link,
        metadata: null,
        readAt: null,
        emailSent: false,
        createdAt: new Date(),
      });
      queueService.addJob.mockResolvedValueOnce({} as never);

      await service.send(event);

      expect(repository.getPreference).toHaveBeenCalledWith(mockUserId, event.type, mockOrgId);
      expect(repository.create).toHaveBeenCalledWith({
        userId: mockUserId,
        orgId: mockOrgId,
        type: event.type,
        title: event.title,
        body: event.body,
        link: event.link,
        metadata: null,
        emailSent: false,
      });
      expect(queueService.addJob).toHaveBeenCalledWith('notification-email', expect.objectContaining({
        userId: mockUserId,
        type: event.type,
      }));
    });

    it('should not throw if notification creation fails', async () => {
      const event = {
        userId: mockUserId,
        type: 'member.role_changed',
        title: 'Test',
      };

      repository.getPreference.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.send(event)).resolves.not.toThrow();
    });

    it('should respect user preferences for in-app notifications', async () => {
      const event = {
        userId: mockUserId,
        type: 'member.role_changed',
        title: 'Test',
      };

      repository.getPreference.mockResolvedValueOnce({
        id: 'pref-123',
        userId: mockUserId,
        orgId: null,
        type: event.type,
        inAppEnabled: false,
        emailEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      queueService.addJob.mockResolvedValueOnce({} as never);

      await service.send(event);

      expect(repository.create).not.toHaveBeenCalled();
      expect(queueService.addJob).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          userId: mockUserId,
          orgId: mockOrgId,
          type: 'member.role_changed',
          title: 'Test',
          body: null,
          link: null,
          metadata: null,
          readAt: null,
          emailSent: false,
          createdAt: new Date(),
        },
      ];

      repository.findByUserId.mockResolvedValueOnce({
        items: mockNotifications,
        total: 1,
        page: 1,
        limit: 20,
      });

      const result = await service.findAll(mockUserId, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      repository.getUnreadCount.mockResolvedValueOnce(5);

      const result = await service.getUnreadCount(mockUserId);

      expect(result.count).toBe(5);
      expect(repository.getUnreadCount).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      repository.markAsRead.mockResolvedValueOnce(true);

      await service.markAsRead(mockUserId, 'notif-123');

      expect(repository.markAsRead).toHaveBeenCalledWith(mockUserId, 'notif-123');
    });

    it('should throw NotFoundException if notification not found', async () => {
      repository.markAsRead.mockResolvedValueOnce(false);

      await expect(service.markAsRead(mockUserId, 'notif-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      repository.markAllAsRead.mockResolvedValueOnce(3);

      const result = await service.markAllAsRead(mockUserId);

      expect(result.count).toBe(3);
      expect(repository.markAllAsRead).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('delete', () => {
    it('should delete notification', async () => {
      repository.delete.mockResolvedValueOnce(true);

      await service.delete(mockUserId, 'notif-123');

      expect(repository.delete).toHaveBeenCalledWith(mockUserId, 'notif-123');
    });

    it('should throw NotFoundException if notification not found', async () => {
      repository.delete.mockResolvedValueOnce(false);

      await expect(service.delete(mockUserId, 'notif-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPreferences', () => {
    it('should return all notification types with preferences', async () => {
      repository.getPreferences.mockResolvedValueOnce([
        {
          id: 'pref-1',
          userId: mockUserId,
          orgId: null,
          type: 'member.role_changed',
          inAppEnabled: false,
          emailEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.getPreferences(mockUserId);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result.find(p => p.type === 'member.role_changed')).toMatchObject({
        type: 'member.role_changed',
        inAppEnabled: false,
        emailEnabled: true,
      });
    });
  });

  describe('updatePreferences', () => {
    it('should update notification preferences', async () => {
      const mockPreference = {
        id: 'pref-123',
        userId: mockUserId,
        orgId: null,
        type: 'member.role_changed',
        inAppEnabled: false,
        emailEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.upsertPreference.mockResolvedValueOnce(mockPreference);

      const result = await service.updatePreferences(mockUserId, 'member.role_changed', false, true);

      expect(result.inAppEnabled).toBe(false);
      expect(result.emailEnabled).toBe(true);
      expect(repository.upsertPreference).toHaveBeenCalled();
    });

    it('should throw NotFoundException for unknown notification type', async () => {
      await expect(
        service.updatePreferences(mockUserId, 'unknown.type', true, true)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
