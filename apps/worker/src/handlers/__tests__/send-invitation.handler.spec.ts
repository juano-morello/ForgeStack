/**
 * Send Invitation Handler Tests
 */

import { Job } from 'bullmq';
import { handleSendInvitation, SendInvitationJobData } from '../send-invitation.handler';
import { sendEmail } from '../../services/email.service';

// Mock the email service
jest.mock('../../services/email.service');

// Mock the render function
jest.mock('@react-email/components', () => ({
  render: jest.fn().mockResolvedValue('<html>Mocked email HTML</html>'),
}));

// Mock the email templates
jest.mock('@forgestack/emails', () => ({
  InvitationEmail: jest.fn((props) => props),
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

describe('SendInvitationHandler', () => {
  const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendEmail.mockResolvedValue({ id: 'test-email-id' });
  });

  describe('handleSendInvitation', () => {
    it('should send invitation email with inviter name', async () => {
      const jobData: SendInvitationJobData = {
        invitationId: 'inv-123',
        email: 'newuser@example.com',
        orgName: 'Acme Corp',
        role: 'MEMBER',
        token: 'abc123token',
        inviterName: 'John Doe',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<SendInvitationJobData>;

      const result = await handleSendInvitation(mockJob);

      expect(result).toEqual({
        sent: true,
        email: 'newuser@example.com',
      });

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'newuser@example.com',
        subject: "You're invited to join Acme Corp",
        html: expect.any(String),
      });
    });

    it('should send invitation email without inviter name', async () => {
      const jobData: SendInvitationJobData = {
        invitationId: 'inv-123',
        email: 'newuser@example.com',
        orgName: 'Acme Corp',
        role: 'MEMBER',
        token: 'abc123token',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<SendInvitationJobData>;

      const result = await handleSendInvitation(mockJob);

      expect(result).toEqual({
        sent: true,
        email: 'newuser@example.com',
      });

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'newuser@example.com',
        subject: "You're invited to join Acme Corp",
        html: expect.any(String),
      });
    });

    it('should render email using template', async () => {
      const jobData: SendInvitationJobData = {
        invitationId: 'inv-123',
        email: 'newuser@example.com',
        orgName: 'Acme Corp',
        role: 'MEMBER',
        token: 'abc123token',
        inviterName: 'John Doe',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<SendInvitationJobData>;

      await handleSendInvitation(mockJob);

      const emailCall = mockSendEmail.mock.calls[0][0];
      expect(emailCall.html).toBeDefined();
      expect(emailCall.html).toBe('<html>Mocked email HTML</html>');
    });
  });
});

