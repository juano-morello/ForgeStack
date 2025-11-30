/**
 * Billing Module
 * Handles Stripe billing and subscription management
 */

import { Module, forwardRef } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingRepository } from './billing.repository';
import { StripeService } from './stripe.service';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module';

@Module({
  imports: [forwardRef(() => FeatureFlagsModule)],
  controllers: [BillingController],
  providers: [BillingService, BillingRepository, StripeService],
  exports: [BillingService, BillingRepository, StripeService],
})
export class BillingModule {}

