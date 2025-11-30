import 'dotenv/config';

export const config = {
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.EMAIL_FROM || 'ForgeStack <noreply@forgestack.dev>',
    appUrl: process.env.APP_URL || 'http://localhost:3000',
  },
  stripe: {
    // Map Stripe price IDs to plan names
    // Format: comma-separated pairs of "priceId:planName"
    // Example: "price_123:starter,price_456:pro,price_789:enterprise"
    priceToPlanMap: parsePriceToPlanMap(process.env.STRIPE_PRICE_TO_PLAN_MAP || ''),
  },
};

/**
 * Parse the STRIPE_PRICE_TO_PLAN_MAP environment variable
 * Format: "price_id1:plan1,price_id2:plan2"
 */
function parsePriceToPlanMap(envValue: string): Record<string, string> {
  if (!envValue) return {};

  const map: Record<string, string> = {};
  const pairs = envValue.split(',');

  for (const pair of pairs) {
    const [priceId, plan] = pair.trim().split(':');
    if (priceId && plan) {
      map[priceId.trim()] = plan.trim();
    }
  }

  return map;
}

