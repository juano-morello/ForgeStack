import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RequireRoleGuard } from './require-role.guard';

describe('RequireRoleGuard', () => {
  let guard: RequireRoleGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequireRoleGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RequireRoleGuard>(RequireRoleGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  const createMockContext = (tenantContext?: unknown): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({ tenantContext }),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext);

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no role requirement is specified', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ role: 'MEMBER' });
    
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when empty roles array', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const context = createMockContext({ role: 'MEMBER' });
    
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has required OWNER role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['OWNER']);
    const context = createMockContext({ role: 'OWNER', orgId: 'org-1', userId: 'user-1' });
    
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has one of multiple allowed roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['OWNER', 'MEMBER']);
    const context = createMockContext({ role: 'MEMBER', orgId: 'org-1', userId: 'user-1' });
    
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when user lacks required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['OWNER']);
    const context = createMockContext({ role: 'MEMBER', orgId: 'org-1', userId: 'user-1' });
    
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when no tenant context', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['OWNER']);
    const context = createMockContext(undefined);
    
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should include required roles in error message', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['OWNER']);
    const context = createMockContext({ role: 'MEMBER', orgId: 'org-1', userId: 'user-1' });
    
    try {
      guard.canActivate(context);
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as ForbiddenException).message).toContain('OWNER');
    }
  });
});

