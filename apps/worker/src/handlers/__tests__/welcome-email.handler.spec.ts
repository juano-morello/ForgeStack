/**
 * Welcome Email Handler Tests
 */

import { Job } from 'bullmq';
import { handleWelcomeEmail, WelcomeEmailJobData } from '../welcome-email.handler';
import { sendEmail } from '../../services/email.service';
import { config } from '../../config';

// Mock the email service
jest.mock('../../services/email.service');

// Mock the logger
jest.mock('../../telemetry/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe('WelcomeEmailHandler', () => {
  const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendEmail.mockResolvedValue({ id: 'test-email-id' });
  });

  describe('handleWelcomeEmail', () => {
    it('should send welcome email with user name', async () => {
      const jobData: WelcomeEmailJobData = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'John Doe',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<WelcomeEmailJobData>;

      const result = await handleWelcomeEmail(mockJob);

      expect(result).toEqual({
        sent: true,
        email: 'test@example.com',
      });

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Welcome to ForgeStack! 🚀',
        html: expect.stringContaining('Hi John Doe'),
        text: expect.stringContaining('Hi John Doe'),
      });
    });

    it('should send welcome email without user name', async () => {
      const jobData: WelcomeEmailJobData = {
        userId: 'user-123',
        email: 'test@example.com',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<WelcomeEmailJobData>;

      const result = await handleWelcomeEmail(mockJob);

      expect(result).toEqual({
        sent: true,
        email: 'test@example.com',
      });

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Welcome to ForgeStack! 🚀',
        html: expect.stringContaining('Welcome'),
        text: expect.stringContaining('Welcome'),
      });
    });

    it('should include dashboard URL in email', async () => {
      const jobData: WelcomeEmailJobData = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Jane Doe',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<WelcomeEmailJobData>;

      await handleWelcomeEmail(mockJob);

      const dashboardUrl = `${config.email.appUrl}/dashboard`;
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Welcome to ForgeStack! 🚀',
        html: expect.stringContaining(dashboardUrl),
        text: expect.stringContaining(dashboardUrl),
      });
    });

    it('should handle email service errors', async () => {
      const jobData: WelcomeEmailJobData = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'John Doe',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<WelcomeEmailJobData>;

      const error = new Error('Email service unavailable');
      mockSendEmail.mockRejectedValue(error);

      await expect(handleWelcomeEmail(mockJob)).rejects.toThrow('Email service unavailable');
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });

    it('should include both HTML and text versions', async () => {
      const jobData: WelcomeEmailJobData = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'John Doe',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<WelcomeEmailJobData>;

      await handleWelcomeEmail(mockJob);

      const emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.html).toBeDefined();
      expect(emailCall.text).toBeDefined();
      expect(emailCall.html).toContain('Hi John Doe');
      expect(emailCall.text).toContain('Hi John Doe');
    });
  });
});

