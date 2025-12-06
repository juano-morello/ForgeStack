/**
 * Notifications Controller Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let notificationsService: jest.Mocked<NotificationsService>;

  const mockRequest = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
    },
  };

  const mockNotification = {
    id: 'notif-123',
    userId: 'user-123',
    type: 'project.created',
    title: 'New Project Created',
    message: 'A new project has been created',
    data: {},
    read: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockNotificationsService = {
      findAll: jest.fn(),
      getUnreadCount: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      delete: jest.fn(),
      getPreferences: jest.fn(),
      updatePreferences: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    notificationsService = module.get(NotificationsService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      const query = { page: 1, limit: 20, unreadOnly: false };
      const mockResult = {
        data: [mockNotification],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      notificationsService.findAll.mockResolvedValue(mockResult as any);

      const result = await controller.findAll(mockRequest as any, query as any);

      expect(result).toEqual(mockResult);
      expect(notificationsService.findAll).toHaveBeenCalledWith('user-123', query);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      notificationsService.getUnreadCount.mockResolvedValue({ count: 5 });

      const result = await controller.getUnreadCount(mockRequest as any);

      expect(result).toEqual({ count: 5 });
      expect(notificationsService.getUnreadCount).toHaveBeenCalledWith('user-123');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      notificationsService.markAsRead.mockResolvedValue(undefined);

      await controller.markAsRead(mockRequest as any, 'notif-123');

      expect(notificationsService.markAsRead).toHaveBeenCalledWith('user-123', 'notif-123');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      notificationsService.markAllAsRead.mockResolvedValue({ count: 5 });

      const result = await controller.markAllAsRead(mockRequest as any);

      expect(result).toEqual({ success: true, count: 5 });
      expect(notificationsService.markAllAsRead).toHaveBeenCalledWith('user-123');
    });
  });

  describe('delete', () => {
    it('should delete notification', async () => {
      notificationsService.delete.mockResolvedValue(undefined);

      await controller.delete(mockRequest as any, 'notif-123');

      expect(notificationsService.delete).toHaveBeenCalledWith('user-123', 'notif-123');
    });
  });

  describe('getPreferences', () => {
    it('should return notification preferences', async () => {
      const mockPreferences = [
        {
          type: 'project.created',
          inAppEnabled: true,
          emailEnabled: true,
        },
      ];

      notificationsService.getPreferences.mockResolvedValue(mockPreferences as any);

      const result = await controller.getPreferences(mockRequest as any);

      expect(result).toEqual({ preferences: mockPreferences });
      expect(notificationsService.getPreferences).toHaveBeenCalledWith('user-123');
    });
  });

  describe('updatePreferences', () => {
    it('should update notification preferences', async () => {
      const updateDto = {
        type: 'project.created',
        inAppEnabled: true,
        emailEnabled: false,
      };

      const mockUpdatedPreferences = {
        type: 'project.created',
        inAppEnabled: true,
        emailEnabled: false,
      };

      notificationsService.updatePreferences.mockResolvedValue(mockUpdatedPreferences as any);

      const result = await controller.updatePreferences(mockRequest as any, updateDto as any);

      expect(result).toEqual({ preference: mockUpdatedPreferences });
      expect(notificationsService.updatePreferences).toHaveBeenCalledWith(
        'user-123',
        'project.created',
        true,
        false,
      );
    });
  });
});

