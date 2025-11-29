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
};

