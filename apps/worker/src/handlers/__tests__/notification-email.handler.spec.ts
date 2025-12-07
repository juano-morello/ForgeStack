/**
 * Notification Email Handler Tests
 */

import { Job } from 'bullmq';
import { handleNotificationEmail, NotificationEmailJobData } from '../notification-email.handler';
import { sendEmail } from '../../services/email.service';
import { withServiceContext } from '@forgestack/db';

// Mock the email service
jest.mock('../../services/email.service');

// Mock the render function
jest.mock('@react-email/components', () => ({
  render: jest.fn().mockResolvedValue('<html>Mocked email HTML</html>'),
}));

// Mock the email templates
jest.mock('@forgestack/emails', () => ({
  NotificationEmail: jest.fn((props) => props),
}));

// Mock database context
jest.mock('@forgestack/db', () => ({
  withServiceContext: jest.fn(),
  notifications: {},
  users: {},
  eq: jest.fn(),
  and: jest.fn(),
}));

// Mock the logger
jest.mock('../../telemetry/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

// Mock config
jest.mock('../../config', () => ({
  config: {
    email: {
      appUrl: 'https://app.forgestack.com',
    },
  },
}));

describe('NotificationEmailHandler', () => {
  const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;
  const mockWithServiceContext = withServiceContext as jest.MockedFunction<typeof withServiceContext>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendEmail.mockResolvedValue({ id: 'test-email-id' });
  });

  describe('handleNotificationEmail', () => {
    it('should send notification email with all fields', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'John Doe',
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);

      let callCount = 0;
      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        callCount++;
        
        if (callCount === 1) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => ({
                  limit: () => [mockUser],
                }),
              }),
            }),
          } as unknown as Parameters<typeof callback>[0]);
        }

        return callback({
          update: mockUpdate,
        } as unknown as Parameters<typeof callback>[0]);
      });

      mockUpdate.mockReturnValue({ set: mockSet });
      mockSet.mockReturnValue({ where: mockWhere });

      const jobData: NotificationEmailJobData = {
        userId: 'user-123',
        orgId: 'org-123',
        type: 'project.created',
        title: 'New Project Created',
        body: 'A new project has been created in your organization.',
        link: '/projects/123',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<NotificationEmailJobData>;

      const result = await handleNotificationEmail(mockJob);

      expect(result).toEqual({
        success: true,
        email: 'test@example.com',
      });

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'New Project Created',
        html: expect.any(String),
      });

      expect(mockSet).toHaveBeenCalledWith({ emailSent: true });
    });

    it('should send notification email without body and link', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'John Doe',
      };

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        return callback({
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => [mockUser],
              }),
            }),
          }),
          update: () => ({
            set: () => ({
              where: jest.fn().mockResolvedValue(undefined),
            }),
          }),
        } as unknown as Parameters<typeof callback>[0]);
      });

      const jobData: NotificationEmailJobData = {
        userId: 'user-123',
        type: 'system.maintenance',
        title: 'System Maintenance',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<NotificationEmailJobData>;

      const result = await handleNotificationEmail(mockJob);

      expect(result).toEqual({
        success: true,
        email: 'test@example.com',
      });

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'System Maintenance',
        html: expect.any(String),
      });
    });

    it('should throw error if user not found', async () => {
      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        return callback({
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => [],
              }),
            }),
          }),
        } as unknown as Parameters<typeof callback>[0]);
      });

      const jobData: NotificationEmailJobData = {
        userId: 'user-123',
        type: 'test',
        title: 'Test',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<NotificationEmailJobData>;

      await expect(handleNotificationEmail(mockJob)).rejects.toThrow('User user-123 not found');
    });

    it('should throw error if user has no email', async () => {
      const mockUser = {
        id: 'user-123',
        email: null,
        name: 'John Doe',
      };

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        return callback({
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => [mockUser],
              }),
            }),
          }),
        } as unknown as Parameters<typeof callback>[0]);
      });

      const jobData: NotificationEmailJobData = {
        userId: 'user-123',
        type: 'test',
        title: 'Test',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<NotificationEmailJobData>;

      await expect(handleNotificationEmail(mockJob)).rejects.toThrow('User user-123 has no email');
    });

    it('should succeed even if updating emailSent flag fails', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'John Doe',
      };

      let callCount = 0;
      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        callCount++;

        if (callCount === 1) {
          return callback({
            select: () => ({
              from: () => ({
                where: () => ({
                  limit: () => [mockUser],
                }),
              }),
            }),
          } as unknown as Parameters<typeof callback>[0]);
        }

        throw new Error('Database error');
      });

      const jobData: NotificationEmailJobData = {
        userId: 'user-123',
        type: 'test',
        title: 'Test',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<NotificationEmailJobData>;

      const result = await handleNotificationEmail(mockJob);

      expect(result).toEqual({
        success: true,
        email: 'test@example.com',
      });
    });

    it('should throw error if email sending fails', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'John Doe',
      };

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        return callback({
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => [mockUser],
              }),
            }),
          }),
        } as unknown as Parameters<typeof callback>[0]);
      });

      mockSendEmail.mockRejectedValue(new Error('Email service error'));

      const jobData: NotificationEmailJobData = {
        userId: 'user-123',
        type: 'test',
        title: 'Test',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<NotificationEmailJobData>;

      await expect(handleNotificationEmail(mockJob)).rejects.toThrow('Email service error');
    });
  });
});
