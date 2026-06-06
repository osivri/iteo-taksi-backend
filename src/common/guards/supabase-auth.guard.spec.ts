import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ProfileCacheService } from '../cache/profile-cache.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';

function mockContext(authHeader?: string): ExecutionContext {
  const request: { headers: { authorization?: string }; user?: unknown } = {
    headers: { authorization: authHeader },
  };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('SupabaseAuthGuard', () => {
  const profileCache = new ProfileCacheService();

  it('rejects privileged role when profile status is not ACTIVE', async () => {
    const guard = new SupabaseAuthGuard(
      {
        anon: {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: { id: 'u1', email: 'a@b.com' } },
              error: null,
            }),
          },
        },
        createUserClient: jest.fn().mockReturnValue({
          from: () => ({
            select: () => ({
              eq: () => ({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: {
                    id: 'u1',
                    first_name: 'A',
                    last_name: 'B',
                    phone: null,
                    email: 'a@b.com',
                    national_id: null,
                    member_no: null,
                    role: 'DRIVER',
                    status: 'PENDING_VERIFICATION',
                    profile_image_url: null,
                    kvkk_accepted_at: null,
                    city: null,
                    district: null,
                    address_line: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
        hasServiceRole: () => false,
      } as never,
      profileCache,
    );

    await expect(
      guard.canActivate(mockContext('Bearer token')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('does not grant ADMIN from metadata when profile is missing', async () => {
    const guard = new SupabaseAuthGuard(
      {
        anon: {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: {
                user: {
                  id: 'u2',
                  email: 'x@y.com',
                  user_metadata: { intended_role: 'ADMIN' },
                },
              },
              error: null,
            }),
          },
        },
        createUserClient: jest.fn().mockReturnValue({
          from: () => ({
            select: () => ({
              eq: () => ({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
        hasServiceRole: () => false,
      } as never,
      profileCache,
    );

    const ctx = mockContext('Bearer token');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);

    const request = ctx.switchToHttp().getRequest<{ user: { role: string; profile: { status: string } } }>();
    expect(request.user.role).toBe('USER');
    expect(request.user.profile.status).toBe('PENDING_VERIFICATION');
  });
});
