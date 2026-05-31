import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { AuthUser, ProfileRow, UserRole } from '../interfaces/auth-user.interface';
import { extractBearerToken } from '../interfaces/auth-user.interface';

function stubProfile(userId: string, email: string | null, role: UserRole): ProfileRow {
  const now = new Date().toISOString();
  return {
    id: userId,
    first_name: 'İTEO',
    last_name: 'Üyesi',
    phone: null,
    email,
    national_id: null,
    member_no: null,
    role,
    status: 'PENDING_VERIFICATION',
    profile_image_url: null,
    kvkk_accepted_at: null,
    created_at: now,
    updated_at: now,
  };
}

function resolveIntendedRole(metadata: Record<string, unknown> | undefined): UserRole {
  const value = metadata?.intended_role;
  if (value === 'DRIVER' || value === 'PLATE_OWNER' || value === 'USER') return value;
  if (value === 'ADMIN' || value === 'SUPER_ADMIN') return value;
  return 'USER';
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

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

    const userClient = this.supabase.createUserClient(token);
    let profile: ProfileRow | null = null;

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

    if (!profile) {
      profile = stubProfile(
        data.user.id,
        data.user.email ?? null,
        resolveIntendedRole(data.user.user_metadata as Record<string, unknown> | undefined),
      );
    }

    if (profile.status === 'PASSIVE') {
      throw new UnauthorizedException('Hesap pasif durumda');
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
