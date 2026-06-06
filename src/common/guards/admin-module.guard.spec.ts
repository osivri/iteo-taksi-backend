import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminModuleGuard } from './admin-module.guard';

describe('AdminModuleGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const guard = new AdminModuleGuard(reflector);

  it('allows SUPER_ADMIN for restricted modules', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue('finance');
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'SUPER_ADMIN' } }),
      }),
    };

    expect(guard.canActivate(ctx as never)).toBe(true);
  });

  it('blocks ADMIN from finance module', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue('finance');
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'ADMIN' } }),
      }),
    };

    expect(() => guard.canActivate(ctx as never)).toThrow(ForbiddenException);
  });

  it('allows ADMIN for announcements module', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue('announcements');
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'ADMIN' } }),
      }),
    };

    expect(guard.canActivate(ctx as never)).toBe(true);
  });
});
