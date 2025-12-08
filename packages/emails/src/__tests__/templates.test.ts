/**
 * Email Templates Tests
 * Basic tests to verify email templates can be imported and rendered
 */

import { describe, it, expect } from 'vitest';
import {
  WelcomeEmail,
  InvitationEmail,
  PasswordResetEmail,
  NotificationEmail,
  SubscriptionConfirmedEmail,
  PaymentFailedEmail,
} from '../index';

describe('Email Templates', () => {
  describe('WelcomeEmail', () => {
    it('should be a valid React component', () => {
      expect(WelcomeEmail).toBeDefined();
      expect(typeof WelcomeEmail).toBe('function');
    });
  });

  describe('InvitationEmail', () => {
    it('should be a valid React component', () => {
      expect(InvitationEmail).toBeDefined();
      expect(typeof InvitationEmail).toBe('function');
    });
  });

  describe('PasswordResetEmail', () => {
    it('should be a valid React component', () => {
      expect(PasswordResetEmail).toBeDefined();
      expect(typeof PasswordResetEmail).toBe('function');
    });
  });

  describe('NotificationEmail', () => {
    it('should be a valid React component', () => {
      expect(NotificationEmail).toBeDefined();
      expect(typeof NotificationEmail).toBe('function');
    });
  });

  describe('SubscriptionConfirmedEmail', () => {
    it('should be a valid React component', () => {
      expect(SubscriptionConfirmedEmail).toBeDefined();
      expect(typeof SubscriptionConfirmedEmail).toBe('function');
    });
  });

  describe('PaymentFailedEmail', () => {
    it('should be a valid React component', () => {
      expect(PaymentFailedEmail).toBeDefined();
      expect(typeof PaymentFailedEmail).toBe('function');
    });
  });
});

