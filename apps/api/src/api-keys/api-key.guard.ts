/**
 * API Key Guard
 * Authenticates requests using API keys
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeysService } from './api-keys.service';
import { hasRequiredScope } from './key-utils';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract API key from headers
    const apiKey = this.extractApiKey(request);
    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    // Validate key and get org context
    const keyData = await this.apiKeysService.validateKey(apiKey);
    if (!keyData) {
      throw new UnauthorizedException('Invalid or expired API key');
    }

    // Check required scopes
    const requiredScopes = this.reflector.get<string[]>('scopes', context.getHandler()) || [];
    for (const scope of requiredScopes) {
      if (!hasRequiredScope(keyData.scopes, scope)) {
        throw new ForbiddenException(`Missing required scope: ${scope}`);
      }
    }

    // Set tenant context on request (compatible with existing guards)
    request.tenantContext = {
      orgId: keyData.orgId,
      userId: keyData.createdBy,
      role: this.determineRoleFromScopes(keyData.scopes),
    };

    // Also set API key metadata
    request.apiKey = {
      id: keyData.id,
      scopes: keyData.scopes,
    };

    return true;
  }

  /**
   * Determine the appropriate role for an API key based on its scopes
   * Keys with admin/write scopes for all resources get OWNER, otherwise MEMBER
   */
  private determineRoleFromScopes(scopes: string[]): 'OWNER' | 'MEMBER' {
    // Admin scopes that warrant OWNER access
    const adminScopes = [
      '*',
      'members:write',
      'billing:write',
      'api-keys:write',
    ];

    // If key has any admin scope, grant OWNER
    const hasAdminScope = scopes.some(scope => adminScopes.includes(scope));

    return hasAdminScope ? 'OWNER' : 'MEMBER';
  }

  /**
   * Extract API key from request headers
   * Checks X-API-Key header and Authorization: Bearer header
   */
  private extractApiKey(request: { headers: Record<string, string | string[] | undefined> }): string | null {
    // Check X-API-Key header
    const xApiKey = request.headers['x-api-key'];
    if (typeof xApiKey === 'string') return xApiKey;

    // Check Authorization: Bearer header
    const auth = request.headers['authorization'];
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
      const token = auth.slice(7);
      // Only treat as API key if it has the fsk_ prefix
      if (token.startsWith('fsk_')) {
        return token;
      }
    }

    return null;
  }
}

