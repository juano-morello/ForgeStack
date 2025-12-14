/**
 * Rate limiting configuration
 */

export interface RateLimitConfig {
  enabled: boolean;
  failOpen: boolean; // Allow requests if Redis is down (non-production)
  failOpenInProduction: boolean; // Allow requests if Redis is down in production (must explicitly opt-in)
  limits: {
    free: { minute: number; hour: number; day: number };
    starter: { minute: number; hour: number; day: number };
    pro: { minute: number; hour: number; day: number };
    enterprise: { minute: number; hour: number | null; day: number | null };
  };
}

export const RATE_LIMIT_CONFIG: RateLimitConfig = {
  enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
  failOpen: process.env.RATE_LIMIT_FAIL_OPEN !== 'false',
  failOpenInProduction: process.env.RATE_LIMIT_FAIL_OPEN_PRODUCTION === 'true', // Must explicitly opt-in
  limits: {
    free: { minute: 100, hour: 1000, day: 10000 },
    starter: { minute: 500, hour: 10000, day: 100000 },
    pro: { minute: 2000, hour: 50000, day: 500000 },
    enterprise: { minute: 10000, hour: null, day: null },
  },
};

// Default limits for IP-based rate limiting (auth endpoints)
export const IP_RATE_LIMITS = {
  auth: { minute: 20, hour: 200 }, // Login attempts
  public: { minute: 60, hour: 1000 }, // Public endpoints
};

