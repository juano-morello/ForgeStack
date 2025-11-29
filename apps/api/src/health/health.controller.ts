/**
 * Health check controller
 * Returns API health status
 */

import { Controller, Get } from '@nestjs/common';
import { Public } from '../core/decorators/public.decorator';

interface HealthResponse {
  status: string;
  timestamp: string;
}

@Controller('health')
export class HealthController {
  @Get()
  @Public()
  check(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

