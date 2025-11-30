import { generateWebhookSecret, signWebhookPayload, verifyWebhookSignature } from './webhook-signing';

describe('Webhook Signing', () => {
  describe('generateWebhookSecret', () => {
    it('should generate a secret with whsec_ prefix', () => {
      const secret = generateWebhookSecret();
      expect(secret).toMatch(/^whsec_[A-Za-z0-9_-]+$/);
    });

    it('should generate unique secrets', () => {
      const secret1 = generateWebhookSecret();
      const secret2 = generateWebhookSecret();
      expect(secret1).not.toBe(secret2);
    });

    it('should generate secrets of consistent length', () => {
      const secret1 = generateWebhookSecret();
      const secret2 = generateWebhookSecret();
      expect(secret1.length).toBe(secret2.length);
    });
  });

  describe('signWebhookPayload', () => {
    const payload = JSON.stringify({ test: 'data' });
    const secret = 'whsec_test123';
    const timestamp = 1234567890;

    it('should produce consistent signatures for same input', () => {
      const sig1 = signWebhookPayload(payload, secret, timestamp);
      const sig2 = signWebhookPayload(payload, secret, timestamp);
      expect(sig1).toBe(sig2);
    });

    it('should produce different signatures for different payloads', () => {
      const payload2 = JSON.stringify({ test: 'different' });
      const sig1 = signWebhookPayload(payload, secret, timestamp);
      const sig2 = signWebhookPayload(payload2, secret, timestamp);
      expect(sig1).not.toBe(sig2);
    });

    it('should produce different signatures for different secrets', () => {
      const secret2 = 'whsec_different';
      const sig1 = signWebhookPayload(payload, secret, timestamp);
      const sig2 = signWebhookPayload(payload, secret2, timestamp);
      expect(sig1).not.toBe(sig2);
    });

    it('should produce different signatures for different timestamps', () => {
      const timestamp2 = 9876543210;
      const sig1 = signWebhookPayload(payload, secret, timestamp);
      const sig2 = signWebhookPayload(payload, secret, timestamp2);
      expect(sig1).not.toBe(sig2);
    });

    it('should return signature in correct format', () => {
      const signature = signWebhookPayload(payload, secret, timestamp);
      expect(signature).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
    });
  });

  describe('verifyWebhookSignature', () => {
    const payload = JSON.stringify({ test: 'data' });
    const secret = 'whsec_test123';
    const timestamp = Math.floor(Date.now() / 1000);

    it('should verify a valid signature', () => {
      const signature = signWebhookPayload(payload, secret, timestamp);
      const isValid = verifyWebhookSignature(payload, signature, secret);
      expect(isValid).toBe(true);
    });

    it('should reject an invalid signature', () => {
      const signature = signWebhookPayload(payload, secret, timestamp);
      const tamperedSignature = signature.replace(/[a-f]/, 'x');
      const isValid = verifyWebhookSignature(payload, tamperedSignature, secret);
      expect(isValid).toBe(false);
    });

    it('should reject a signature with wrong secret', () => {
      const signature = signWebhookPayload(payload, secret, timestamp);
      const wrongSecret = 'whsec_wrong';
      const isValid = verifyWebhookSignature(payload, signature, wrongSecret);
      expect(isValid).toBe(false);
    });

    it('should reject a signature with tampered payload', () => {
      const signature = signWebhookPayload(payload, secret, timestamp);
      const tamperedPayload = JSON.stringify({ test: 'tampered' });
      const isValid = verifyWebhookSignature(tamperedPayload, signature, secret);
      expect(isValid).toBe(false);
    });

    it('should reject a signature outside tolerance window', () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago
      const signature = signWebhookPayload(payload, secret, oldTimestamp);
      const isValid = verifyWebhookSignature(payload, signature, secret, 300); // 5 minute tolerance
      expect(isValid).toBe(false);
    });

    it('should accept a signature within tolerance window', () => {
      const recentTimestamp = Math.floor(Date.now() / 1000) - 100; // 100 seconds ago
      const signature = signWebhookPayload(payload, secret, recentTimestamp);
      const isValid = verifyWebhookSignature(payload, signature, secret, 300); // 5 minute tolerance
      expect(isValid).toBe(true);
    });

    it('should reject malformed signature', () => {
      const isValid = verifyWebhookSignature(payload, 'invalid', secret);
      expect(isValid).toBe(false);
    });

    it('should reject signature with missing timestamp', () => {
      const isValid = verifyWebhookSignature(payload, 'v1=abc123', secret);
      expect(isValid).toBe(false);
    });

    it('should reject signature with missing v1', () => {
      const isValid = verifyWebhookSignature(payload, 't=1234567890', secret);
      expect(isValid).toBe(false);
    });
  });
});

