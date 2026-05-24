import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { AuthUser } from '../interfaces/auth-user.interface';
import { extractBearerToken } from '../interfaces/auth-user.interface';

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
    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      throw new UnauthorizedException('Profil bulunamadı');
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
