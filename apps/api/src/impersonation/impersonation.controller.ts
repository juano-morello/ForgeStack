/**
 * Impersonation Controller
 * Super-admin endpoints for user impersonation
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Logger,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { ImpersonationService } from './impersonation.service';
import {
  StartImpersonationDto,
  StartImpersonationResponseDto,
  EndImpersonationResponseDto,
  GetImpersonationStatusResponseDto,
  ListActiveSessionsResponseDto,
  ImpersonationSessionDto,
  ActiveImpersonationSessionDto,
} from './dto';
import { RequireSuperAdmin } from '../core/decorators/require-super-admin.decorator';
import { NoOrgRequired } from '../core/decorators/no-org-required.decorator';
import type { PlatformAuditContext } from '../admin/platform-audit/platform-audit.service';
import type { RequestWithUser } from '../core/types';

const IMPERSONATION_COOKIE_NAME = 'forgestack-impersonation';
const COOKIE_MAX_AGE = 60 * 60 * 1000; // 1 hour

@ApiTags('Admin - Impersonation')
@ApiBearerAuth()
@Controller('admin/impersonate')
@RequireSuperAdmin()
@NoOrgRequired()
export class ImpersonationController {
  private readonly logger = new Logger(ImpersonationController.name);

  constructor(private readonly impersonationService: ImpersonationService) {}

  /**
   * Start impersonating a user
   * POST /admin/impersonate/:userId
   */
  @Post(':userId')
  @ApiOperation({ summary: 'Start impersonating a user' })
  @ApiParam({ name: 'userId', description: 'Target user ID to impersonate' })
  @ApiResponse({ status: 201, type: StartImpersonationResponseDto })
  async startImpersonation(
    @Param('userId') targetUserId: string,
    @Body() dto: StartImpersonationDto,
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StartImpersonationResponseDto> {
    this.logger.log(`Starting impersonation: ${req.user.id} -> ${targetUserId}`);

    const auditContext = this.getAuditContext(req);
    const session = await this.impersonationService.startImpersonation(
      req.user.id,
      targetUserId,
      dto.durationMinutes,
      req.ip || null,
      req.headers['user-agent'] || null,
      auditContext,
    );

    // Set impersonation cookie
    res.cookie(IMPERSONATION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
    });

    // Get target user details
    const targetUser = await this.impersonationService['impersonationRepository'].findUserById(targetUserId);

    return {
      success: true,
      impersonation: this.mapToSessionDto(session, targetUser!),
    };
  }

  /**
   * End current impersonation
   * POST /admin/impersonate/end
   */
  @Post('end')
  @ApiOperation({ summary: 'End current impersonation session' })
  @ApiResponse({ status: 200, type: EndImpersonationResponseDto })
  async endImpersonation(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<EndImpersonationResponseDto> {
    this.logger.log('Ending impersonation session');

    const token = req.cookies[IMPERSONATION_COOKIE_NAME];
    if (!token) {
      return {
        success: false,
        session: {
          duration: 0,
          actionsPerformed: 0,
          endedAt: new Date().toISOString(),
        },
      };
    }

    const auditContext = this.getAuditContext(req);
    const session = await this.impersonationService.endImpersonation(token, auditContext);

    // Clear impersonation cookie
    res.clearCookie(IMPERSONATION_COOKIE_NAME);

    const duration = Math.floor((session.endedAt!.getTime() - session.startedAt.getTime()) / 1000);

    return {
      success: true,
      session: {
        duration,
        actionsPerformed: session.actionsCount,
        endedAt: session.endedAt!.toISOString(),
      },
    };
  }

  /**
   * Get current impersonation status
   * GET /admin/impersonate/session
   */
  @Get('session')
  @ApiOperation({ summary: 'Get current impersonation status' })
  @ApiResponse({ status: 200, type: GetImpersonationStatusResponseDto })
  async getStatus(
    @Req() req: RequestWithUser,
  ): Promise<GetImpersonationStatusResponseDto> {
    const session = await this.impersonationService.getActiveSession(req.user.id);

    if (!session) {
      return {
        isImpersonating: false,
        session: null,
      };
    }

    const targetUser = await this.impersonationService['impersonationRepository'].findUserById(session.targetUserId);

    return {
      isImpersonating: true,
      session: this.mapToSessionDto(session, targetUser!),
    };
  }

  /**
   * List all active impersonation sessions
   * GET /admin/impersonate/active
   */
  @Get('active')
  @ApiOperation({ summary: 'List all active impersonation sessions' })
  @ApiResponse({ status: 200, type: ListActiveSessionsResponseDto })
  async listActiveSessions(): Promise<ListActiveSessionsResponseDto> {
    this.logger.log('Listing all active impersonation sessions');

    const sessions = await this.impersonationService.getActiveSessions();

    const sessionDtos: ActiveImpersonationSessionDto[] = [];
    for (const session of sessions) {
      const actor = await this.impersonationService['impersonationRepository'].findUserById(session.actorId);
      const targetUser = await this.impersonationService['impersonationRepository'].findUserById(session.targetUserId);

      if (actor && targetUser) {
        sessionDtos.push({
          sessionId: session.id,
          actor: {
            id: actor.id,
            email: actor.email,
            name: actor.name,
          },
          targetUser: {
            id: targetUser.id,
            email: targetUser.email,
            name: targetUser.name,
          },
          startedAt: session.startedAt.toISOString(),
          expiresAt: session.expiresAt.toISOString(),
        });
      }
    }

    return {
      sessions: sessionDtos,
      count: sessionDtos.length,
    };
  }

  /**
   * Force end an impersonation session
   * DELETE /admin/impersonate/:sessionId
   */
  @Delete(':sessionId')
  @ApiOperation({ summary: 'Force end an impersonation session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID to end' })
  @ApiResponse({ status: 200, description: 'Session ended successfully' })
  async forceEndSession(
    @Param('sessionId') sessionId: string,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    this.logger.log(`Force ending impersonation session: ${sessionId}`);

    const auditContext = this.getAuditContext(req);
    await this.impersonationService.forceEndSession(sessionId, auditContext);

    return { message: 'Impersonation session ended successfully' };
  }

  /**
   * Extract audit context from request
   */
  private getAuditContext(req: RequestWithUser): PlatformAuditContext {
    return {
      actorId: req.user.id,
      actorEmail: req.user.email || '',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string | undefined,
    };
  }

  /**
   * Map session to DTO
   */
  private mapToSessionDto(
    session: any,
    targetUser: { id: string; email: string; name: string | null },
  ): ImpersonationSessionDto {
    const now = new Date();
    const remainingSeconds = Math.max(0, Math.floor((session.expiresAt.getTime() - now.getTime()) / 1000));

    return {
      sessionId: session.id,
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
      },
      startedAt: session.startedAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      remainingSeconds,
    };
  }
}

