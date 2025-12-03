import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SuperAdminGuard } from './super-admin.guard';
import { REQUIRE_SUPER_ADMIN_KEY } from '../decorators/require-super-admin.decorator';

interface MockUser {
  id: string;
  email?: string;
  isSuperAdmin?: boolean;
}

describe('SuperAdminGuard', () => {
  let guard: SuperAdminGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new SuperAdminGuard(reflector);
  });

  const createMockContext = (user: MockUser | null, requireSuperAdmin = true): ExecutionContext => {
    const mockRequest = {
      user,
    };

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requireSuperAdmin);

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  };

  describe('canActivate', () => {
    it('should allow access when super-admin is not required', () => {
      const context = createMockContext({ id: 'user-1' }, false);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access for super-admin users', () => {
      const context = createMockContext({
        id: 'user-1',
        email: 'admin@example.com',
        isSuperAdmin: true,
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access for non-super-admin users', () => {
      const context = createMockContext({
        id: 'user-1',
        email: 'user@example.com',
        isSuperAdmin: false,
      });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Super-admin access required');
    });

    it('should deny access when user is not authenticated', () => {
      const context = createMockContext(null);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Super-admin access required');
    });

    it('should deny access when user object exists but isSuperAdmin is undefined', () => {
      const context = createMockContext({
        id: 'user-1',
        email: 'user@example.com',
      });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('metadata reflection', () => {
    it('should check metadata from both handler and class', () => {
      const context = createMockContext({ id: 'user-1', isSuperAdmin: true });
      const getAllAndOverrideSpy = jest.spyOn(reflector, 'getAllAndOverride');

      guard.canActivate(context);

      expect(getAllAndOverrideSpy).toHaveBeenCalledWith(
        REQUIRE_SUPER_ADMIN_KEY,
        [context.getHandler(), context.getClass()]
      );
    });
  });
});

