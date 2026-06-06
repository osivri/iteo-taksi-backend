import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ProfileCacheService } from '../cache/profile-cache.service';
import { SupabaseService } from '../../supabase/supabase.service';
import type { AuthUser, ProfileRow } from '../interfaces/auth-user.interface';
import { extractBearerToken } from '../interfaces/auth-user.interface';

const PRIVILEGED_ROLES = ['DRIVER', 'PLATE_OWNER', 'ADMIN', 'SUPER_ADMIN'] as const;

function pendingProfileStub(userId: string, email: string | null): ProfileRow {
  const now = new Date().toISOString();
  return {
    id: userId,
    first_name: 'İTEO',
    last_name: 'Üyesi',
    phone: null,
    email,
    national_id: null,
    member_no: null,
    role: 'USER',
    status: 'PENDING_VERIFICATION',
    profile_image_url: null,
    kvkk_accepted_at: null,
    city: null,
    district: null,
    address_line: null,
    created_at: now,
    updated_at: now,
  };
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly profileCache: ProfileCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser; headers: { authorization?: string } }>();
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Bearer token gerekli');
    }

    const { data, error } = await this.supabase.anon.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Geçersiz oturum');
    }

    let profile: ProfileRow | null = this.profileCache.get(data.user.id);

    if (!profile) {
      const userClient = this.supabase.createUserClient(token);

      const { data: userProfile, error: profileError } = await userClient
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!profileError && userProfile) {
        profile = userProfile;
      } else if (this.supabase.hasServiceRole()) {
        const { data: adminProfile } = await this.supabase.admin
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        profile = adminProfile ?? null;
      }

      if (profile) {
        this.profileCache.set(data.user.id, profile);
      }
    }

    if (!profile) {
      profile = pendingProfileStub(data.user.id, data.user.email ?? null);
    }

    if (profile.status === 'PASSIVE') {
      throw new UnauthorizedException('Hesap pasif durumda');
    }

    if (
      PRIVILEGED_ROLES.includes(profile.role as (typeof PRIVILEGED_ROLES)[number]) &&
      profile.status !== 'ACTIVE'
    ) {
      throw new UnauthorizedException('Hesap onayı bekleniyor');
    }

    request.user = {
      id: data.user.id,
      email: data.user.email ?? null,
      accessToken: token,
      role: profile.role,
      profile,
    };

    return true;
  }
}
