import { Controller, Post, Body, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { Public } from '../core/decorators/public.decorator';

/**
 * Queue Controller
 * Provides endpoints for queue management and testing.
 *
 * NOTE: Test endpoints are only available in non-production environments.
 */
@Controller('queue')
export class QueueController {
  constructor(
    private readonly queueService: QueueService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Test endpoint for welcome email queue
   * Only available in development/test environments
   */
  @Public()
  @Post('test-welcome-email')
  async testWelcomeEmail(@Body() body: { userId: string; email: string }) {
    // Security: Only allow in non-production environments
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    if (nodeEnv === 'production') {
      throw new ForbiddenException('Test endpoints are not available in production');
    }

    const job = await this.queueService.addJob('welcome-email', body);
    return { jobId: job.id, status: 'queued' };
  }
}

