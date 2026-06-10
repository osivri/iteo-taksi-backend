import { UsersService } from './users.service';

describe('UsersService onboarding', () => {
  const profileCache = { invalidate: jest.fn() };
  const pushService = {} as never;

  function buildService(profileRow: Record<string, unknown> | null) {
    const supabase = {
      createUserClient: jest.fn().mockReturnValue({
        from: () => ({
          update: () => ({
            eq: () => ({
              select: () => ({
                maybeSingle: jest.fn().mockResolvedValue({ data: profileRow, error: null }),
              }),
            }),
          }),
        }),
      }),
      admin: {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: jest.fn().mockResolvedValue({
                data: profileRow ? { role: profileRow.role } : null,
                error: null,
              }),
            }),
          }),
        }),
      },
      hasServiceRole: () => false,
    };

    return new UsersService(supabase as never, pushService, profileCache as never);
  }

  it('sets DRIVER onboarding status to PENDING_VERIFICATION', async () => {
    const service = buildService({
      id: 'u1',
      first_name: 'Ali',
      last_name: 'Veli',
      phone: null,
      email: 'a@b.com',
      national_id: null,
      member_no: null,
      role: 'DRIVER',
      status: 'PENDING_VERIFICATION',
      profile_image_url: null,
      kvkk_accepted_at: null,
      city: 'İstanbul',
      district: 'Kadıköy',
      address_line: 'Adres',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const result = await service.completeOnboarding(
      {
        id: 'u1',
        email: 'a@b.com',
        accessToken: 'token',
        role: 'USER',
        profile: {} as never,
      },
      {
        firstName: 'Ali',
        lastName: 'Veli',
        city: 'İstanbul',
        district: 'Kadıköy',
        addressLine: 'Adres',
      },
    );

    expect(result.status).toBe('PENDING_VERIFICATION');
    expect(result.role).toBe('DRIVER');
  });

  it('maps legacy USER onboarding to PLATE_OWNER with PENDING_VERIFICATION', async () => {
    const service = buildService({
      id: 'u2',
      first_name: 'Ayşe',
      last_name: 'Yılmaz',
      phone: null,
      email: 'b@c.com',
      national_id: null,
      member_no: null,
      role: 'PLATE_OWNER',
      status: 'PENDING_VERIFICATION',
      profile_image_url: null,
      kvkk_accepted_at: null,
      city: 'Ankara',
      district: 'Çankaya',
      address_line: 'Adres',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const result = await service.completeOnboarding(
      {
        id: 'u2',
        email: 'b@c.com',
        accessToken: 'token',
        role: 'PLATE_OWNER',
        profile: {} as never,
      },
      {
        firstName: 'Ayşe',
        lastName: 'Yılmaz',
        city: 'Ankara',
        district: 'Çankaya',
        addressLine: 'Adres',
      },
    );

    expect(result.status).toBe('PENDING_VERIFICATION');
    expect(result.role).toBe('PLATE_OWNER');
  });
});
