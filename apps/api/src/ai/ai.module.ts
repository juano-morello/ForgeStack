/**
 * AI Module
 * Handles AI operations using Vercel AI SDK
 */

import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiRepository } from './ai.repository';
import { AiRateLimiterService } from './ai-rate-limiter.service';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [BillingModule],
  controllers: [AiController],
  providers: [AiService, AiRepository, AiRateLimiterService],
  exports: [AiService, AiRepository],
})
export class AiModule {}

