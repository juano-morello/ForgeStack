/**
 * AuthController
 * Authentication-related endpoints
 */

import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService, BetterAuthUser } from './auth.service';
import { Public } from '../core/decorators/public.decorator';

interface MeResponse {
  user: BetterAuthUser;
  sessionId: string;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * GET /api/v1/auth/me
   * Returns the current authenticated user
   * Note: This endpoint is public but returns 401 if not authenticated
   */
  @Get('me')
  @Public() // Bypass tenant guard - we only need auth, not org context
  @ApiOperation({ summary: 'Get current user', description: 'Returns the currently authenticated user and session information' })
  @ApiResponse({ status: 200, description: 'Current user retrieved successfully' })
  @ApiResponse({ status: 401, description: 'No session token provided or invalid session' })
  async me(@Req() request: Request): Promise<MeResponse> {
    const sessionToken = this.authService.extractSessionToken(request);

    if (!sessionToken) {
      throw new UnauthorizedException('No session token provided');
    }

    const result = await this.authService.verifySession(sessionToken);

    if (!result) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    return {
      user: result.user,
      sessionId: result.session.id,
    };
  }
}

