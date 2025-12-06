/**
 * Email Service Tests
 */

import { SendEmailOptions } from '../email.service';

// Mock Resend
const mockSend = jest.fn();

jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: mockSend,
      },
    })),
  };
});

// Mock config
jest.mock('../../config', () => ({
  config: {
    email: {
      resendApiKey: 'test-api-key',
      fromEmail: 'noreply@forgestack.com',
    },
  },
}));

// Mock logger
jest.mock('../../telemetry/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

// Import after mocks
import { sendEmail } from '../email.service';

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockReset();
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      const options: SendEmailOptions = {
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
      };

      const result = await sendEmail(options);

      expect(result).toEqual({ id: 'email-123' });
      expect(mockSend).toHaveBeenCalledWith({
        from: 'noreply@forgestack.com',
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
      });
    });

    it('should send email without text field', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-456' },
        error: null,
      });

      const options: SendEmailOptions = {
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      const result = await sendEmail(options);

      expect(result).toEqual({ id: 'email-456' });
      expect(mockSend).toHaveBeenCalledWith({
        from: 'noreply@forgestack.com',
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: undefined,
      });
    });

    it('should handle Resend API errors', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'Invalid API key' },
      });

      const options: SendEmailOptions = {
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      await expect(sendEmail(options)).rejects.toThrow('Failed to send email: Invalid API key');
    });

    it('should handle missing email ID in response', async () => {
      mockSend.mockResolvedValue({
        data: {},
        error: null,
      });

      const options: SendEmailOptions = {
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      const result = await sendEmail(options);

      expect(result).toEqual({ id: 'unknown' });
    });
  });

  describe('sendEmail (dev mode - no API key)', () => {
    beforeAll(() => {
      // Re-mock config without API key
      jest.resetModules();
      jest.doMock('../../config', () => ({
        config: {
          email: {
            resendApiKey: null,
            fromEmail: 'noreply@forgestack.com',
          },
        },
      }));
    });

    it('should log email instead of sending when no API key', async () => {
      // Need to re-import after mocking config
      jest.isolateModules(async () => {
        const { sendEmail: sendEmailDev } = await import('../email.service');

        const options: SendEmailOptions = {
          to: 'user@example.com',
          subject: 'Test Email',
          html: '<p>Test content</p>',
          text: 'Test content',
        };

        const result = await sendEmailDev(options);

        expect(result.id).toMatch(/^dev-\d+$/);
        expect(mockSend).not.toHaveBeenCalled();
      });
    });
  });
});

