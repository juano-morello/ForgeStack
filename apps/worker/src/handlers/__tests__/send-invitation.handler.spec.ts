/**
 * Send Invitation Handler Tests
 */

import { Job } from 'bullmq';
import { handleSendInvitation, SendInvitationJobData } from '../send-invitation.handler';
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
        html: expect.stringContaining('John Doe has'),
        text: expect.stringContaining('John Doe has'),
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
        html: expect.stringContaining('You have been'),
        text: expect.stringContaining('You have been'),
      });
    });

    it('should include correct role text for OWNER role', async () => {
      const jobData: SendInvitationJobData = {
        invitationId: 'inv-123',
        email: 'newuser@example.com',
        orgName: 'Acme Corp',
        role: 'OWNER',
        token: 'abc123token',
        inviterName: 'John Doe',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<SendInvitationJobData>;

      await handleSendInvitation(mockJob);

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'newuser@example.com',
        subject: "You're invited to join Acme Corp",
        html: expect.stringContaining('an owner'),
        text: expect.stringContaining('an owner'),
      });
    });

    it('should include correct role text for MEMBER role', async () => {
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

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'newuser@example.com',
        subject: "You're invited to join Acme Corp",
        html: expect.stringContaining('a member'),
        text: expect.stringContaining('a member'),
      });
    });

    it('should include accept and decline URLs with token', async () => {
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

      await handleSendInvitation(mockJob);

      const acceptUrl = `${config.email.appUrl}/invitations/accept?token=abc123token`;

      expect(mockSendEmail).toHaveBeenCalledWith({
        to: 'newuser@example.com',
        subject: "You're invited to join Acme Corp",
        html: expect.stringContaining(acceptUrl),
        text: expect.stringContaining(acceptUrl),
      });
    });
  });
});

