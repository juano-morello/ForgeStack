/**
 * TenantContextGuard
 * Extracts user/org context and verifies membership before allowing requests
 * Uses better-auth for session verification
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type TenantContext, type OrgRole, eq, subscriptions, withServiceContext } from '@forgestack/db';
import { UUID_REGEX } from '@forgestack/shared';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { NO_ORG_REQUIRED_KEY } from '../decorators/no-org-required.decorator';
import { AuthService } from '../../auth/auth.service';
import { OrganizationsRepository } from '../../organizations/organizations.repository';

@Injectable()
export class TenantContextGuard implements CanActivate {
  private readonly logger = new Logger(TenantContextGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    @Inject(forwardRef(() => OrganizationsRepository))
    private readonly organizationsRepository: OrganizationsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Extract and verify session using better-auth
    const userId = await this.extractAndVerifyUserId(request);
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    // Check if route is marked as no-org-required (auth required but no org context)
    const noOrgRequired = this.reflector.getAllAndOverride<boolean>(NO_ORG_REQUIRED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (noOrgRequired) {
      // Attach minimal user context (no org context)
      request.user = request.user || { id: userId };
      this.logger.debug(`NoOrgRequired route accessed by user ${userId}`);
      return true;
    }

    // Extract org ID from header
    const orgId = request.headers['x-org-id'] as string;
    if (!orgId) {
      throw new ForbiddenException('X-Org-Id header required');
    }

    // Validate ID formats
    // All IDs are UUIDs (better-auth configured to generate UUIDs)
    if (!UUID_REGEX.test(userId)) {
      throw new UnauthorizedException('Invalid user ID format');
    }
    if (!UUID_REGEX.test(orgId)) {
      throw new ForbiddenException('Invalid organization ID format');
    }

    // Lookup membership and role using repository
    const membership = await this.lookupMembership(userId, orgId);
    if (!membership) {
      throw new ForbiddenException('Not a member of this organization');
    }

    // Fetch plan for rate limiting (await to ensure it's set before guard returns)
    let plan: string;
    try {
      plan = await this.getOrgPlan(orgId);
    } catch (err) {
      this.logger.warn({ orgId, error: err }, 'Failed to fetch org plan, defaulting to free');
      plan = 'free';
    }

    // Attach context to request
    const tenantContext: TenantContext & { plan?: string } = {
      orgId,
      userId,
      role: membership.role,
      plan,
    };
    request.tenantContext = tenantContext;

    return true;
  }

  /**
   * Get organization's subscription plan
   */
  private async getOrgPlan(orgId: string): Promise<string> {
    const subscription = await withServiceContext('TenantContextGuard.getOrgPlan', async (tx) => {
      const [sub] = await tx
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.orgId, orgId))
        .limit(1);
      return sub;
    });

    return subscription?.plan || 'free';
  }

  /**
   * Extract and verify user ID from better-auth session
   * Checks cookies first, then Authorization header
   */
  private async extractAndVerifyUserId(request: {
    cookies?: Record<string, string>;
    headers?: Record<string, string | string[] | undefined>;
    user?: unknown;
    session?: unknown;
  }): Promise<string | undefined> {
    // Extract session token from cookies or Authorization header
    const sessionToken = this.authService.extractSessionToken(request);

    if (!sessionToken) {
      this.logger.debug('No session token found in request');
      return undefined;
    }

    // Verify session with better-auth
    const result = await this.authService.verifySession(sessionToken);

    if (!result) {
      this.logger.debug('Session verification failed');
      return undefined;
    }

    // Attach user info to request for later use
    request.user = result.user;
    request.session = result.session;

    return result.user.id;
  }

  /**
   * Lookup organization membership using repository
   * Delegates to OrganizationsRepository to avoid direct DB access in guard
   */
  private async lookupMembership(
    userId: string,
    orgId: string,
  ): Promise<{ role: OrgRole } | null> {
    try {
      return await this.organizationsRepository.findMembership(userId, orgId);
    } catch (error) {
      this.logger.error('Membership lookup failed:', error);
      // If database query fails, deny access
      return null;
    }
  }
}

