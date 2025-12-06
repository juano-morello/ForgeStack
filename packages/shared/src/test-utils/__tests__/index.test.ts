/**
 * Test Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  mockUUID,
  createMockUser,
  createMockOrganization,
  createMockProject,
  createMockMember,
  createMockInvitation,
  createMockApiKey,
  createMockActivity,
  createMockNotification,
  createMockWebhookEndpoint,
  createMockWebhookDelivery,
} from '../index';
import { createMockTenantContext, createMockRequest } from '../mock-context';

describe('Test Utilities', () => {
  describe('mockUUID', () => {
    it('should generate a valid UUID v4 format', () => {
      const uuid = mockUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = mockUUID();
      const uuid2 = mockUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('createMockUser', () => {
    it('should create a user with default values', () => {
      const user = createMockUser();
      expect(user).toMatchObject({
        name: 'Test User',
        email: 'test@example.com',
        emailVerified: false,
        isSuperAdmin: false,
      });
      expect(user.id).toBeTruthy();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should allow overriding values', () => {
      const user = createMockUser({ name: 'Custom User', email: 'custom@example.com' });
      expect(user.name).toBe('Custom User');
      expect(user.email).toBe('custom@example.com');
    });
  });

  describe('createMockOrganization', () => {
    it('should create an organization with default values', () => {
      const org = createMockOrganization();
      expect(org).toMatchObject({
        name: 'Test Organization',
        timezone: 'UTC',
        language: 'en',
      });
      expect(org.id).toBeTruthy();
      expect(org.ownerUserId).toBeTruthy();
    });

    it('should allow overriding values', () => {
      const org = createMockOrganization({ name: 'Custom Org' });
      expect(org.name).toBe('Custom Org');
    });
  });

  describe('createMockProject', () => {
    it('should create a project with default values', () => {
      const project = createMockProject();
      expect(project).toMatchObject({
        name: 'Test Project',
        description: 'Test project description',
      });
      expect(project.id).toBeTruthy();
      expect(project.orgId).toBeTruthy();
    });
  });

  describe('createMockMember', () => {
    it('should create a member with default values', () => {
      const member = createMockMember();
      expect(member).toMatchObject({
        role: 'MEMBER',
      });
      expect(member.orgId).toBeTruthy();
      expect(member.userId).toBeTruthy();
      expect(member.joinedAt).toBeInstanceOf(Date);
    });
  });

  describe('createMockInvitation', () => {
    it('should create an invitation with default values', () => {
      const invitation = createMockInvitation();
      expect(invitation).toMatchObject({
        email: 'invite@example.com',
        role: 'MEMBER',
      });
      expect(invitation.id).toBeTruthy();
      expect(invitation.token).toHaveLength(64);
      expect(invitation.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('createMockApiKey', () => {
    it('should create an API key with default values', () => {
      const apiKey = createMockApiKey();
      expect(apiKey).toMatchObject({
        name: 'Test API Key',
        keyPrefix: 'fsk_test_abc123',
      });
      expect(apiKey.id).toBeTruthy();
      expect(apiKey.scopes).toEqual([]);
    });
  });

  describe('createMockActivity', () => {
    it('should create an activity with default values', () => {
      const activity = createMockActivity();
      expect(activity).toMatchObject({
        type: 'project.created',
        title: 'created a new project',
        actorName: 'Test User',
        resourceType: 'project',
        aggregationCount: 1,
      });
      expect(activity.id).toBeTruthy();
    });
  });

  describe('createMockNotification', () => {
    it('should create a notification with default values', () => {
      const notification = createMockNotification();
      expect(notification).toMatchObject({
        type: 'member.invited',
        title: 'You have been invited to an organization',
        emailSent: false,
      });
      expect(notification.id).toBeTruthy();
      expect(notification.readAt).toBeNull();
    });
  });

  describe('createMockWebhookEndpoint', () => {
    it('should create a webhook endpoint with default values', () => {
      const endpoint = createMockWebhookEndpoint();
      expect(endpoint).toMatchObject({
        url: 'https://example.com/webhook',
        enabled: true,
      });
      expect(endpoint.id).toBeTruthy();
      expect(endpoint.secret).toMatch(/^whsec_/);
    });
  });

  describe('createMockWebhookDelivery', () => {
    it('should create a webhook delivery with default values', () => {
      const delivery = createMockWebhookDelivery();
      expect(delivery).toMatchObject({
        eventType: 'project.created',
        attemptNumber: 1,
        payload: { test: 'data' },
      });
      expect(delivery.id).toBeTruthy();
      expect(delivery.endpointId).toBeTruthy();
    });
  });

  describe('createMockTenantContext', () => {
    it('should create a tenant context with default values', () => {
      const context = createMockTenantContext();
      expect(context).toMatchObject({
        role: 'OWNER',
      });
      expect(context.orgId).toBeTruthy();
      expect(context.userId).toBeTruthy();
    });

    it('should allow overriding values', () => {
      const context = createMockTenantContext({ role: 'MEMBER' });
      expect(context.role).toBe('MEMBER');
    });
  });

  describe('createMockRequest', () => {
    it('should create a request with user and tenant context', () => {
      const request = createMockRequest();
      expect(request.user).toBeTruthy();
      expect(request.user.id).toBeTruthy();
      expect(request.tenantContext).toBeTruthy();
      expect(request.tenantContext.userId).toBe(request.user.id);
    });

    it('should use provided userId', () => {
      const userId = 'custom-user-id';
      const request = createMockRequest(userId);
      expect(request.user.id).toBe(userId);
      expect(request.tenantContext.userId).toBe(userId);
    });
  });
});

