import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { MemberLoginDto } from './dto/member-login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  private formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('90') && digits.length === 12) {
      return `+${digits}`;
    }
    if (digits.length === 10 && digits.startsWith('5')) {
      return `+90${digits}`;
    }
    throw new BadRequestException('Geçerli bir Türkiye cep telefonu numarası girin.');
  }

  async requestOtp(dto: RequestOtpDto): Promise<{ message: string }> {
    const phone = this.formatPhone(dto.phone);
    const { error } = await this.supabase.anon.auth.signInWithOtp({ phone });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: 'OTP gönderildi' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const phone = this.formatPhone(dto.phone);
    const { data, error } = await this.supabase.anon.auth.verifyOtp({
      phone,
      token: dto.code,
      type: 'sms',
    });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedException(error?.message ?? 'OTP doğrulanamadı');
    }

    const profile = await this.getProfile(data.user.id);

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      user: profile,
    };
  }

  async memberLogin(dto: MemberLoginDto) {
    const { data, error } = await this.supabase.anon.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedException(error?.message ?? 'Giriş başarısız');
    }

    const profile = await this.getProfile(data.user.id);

    if (['ADMIN', 'SUPER_ADMIN'].includes(profile.role)) {
      await this.supabase.anon.auth.signOut();
      throw new UnauthorizedException(
        'Yönetici hesapları üye panelinden giriş yapamaz. Lütfen yönetim girişini kullanın.',
      );
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      user: profile,
    };
  }

  async memberRegister(dto: RegisterDto) {
    const { data, error } = await this.supabase.anon.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        data: { intended_role: dto.intendedRole ?? 'USER' },
      },
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data.user) {
      throw new BadRequestException('Kayıt oluşturulamadı');
    }

    if (data.session) {
      const profile = await this.getProfile(data.user.id);
      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
        user: profile,
        requiresEmailConfirmation: false,
      };
    }

    return {
      requiresEmailConfirmation: true,
      message:
        'Kayıt oluşturuldu. E-posta doğrulama linki gönderildiyse gelen kutunuzu kontrol edin.',
    };
  }

  async adminLogin(dto: AdminLoginDto) {
    const { data, error } = await this.supabase.anon.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedException(error?.message ?? 'Giriş başarısız');
    }

    const profile = await this.getProfile(data.user.id);

    if (!['ADMIN', 'SUPER_ADMIN'].includes(profile.role)) {
      await this.supabase.anon.auth.signOut();
      throw new UnauthorizedException('Admin yetkisi gerekli');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      user: profile,
    };
  }

  async getMe(accessToken: string) {
    const { data, error } = await this.supabase.anon.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new UnauthorizedException('Geçersiz oturum');
    }

    const userClient = this.supabase.createUserClient(accessToken);
    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      return {
        id: data.user.id,
        firstName: 'İTEO',
        lastName: 'Üyesi',
        phone: null,
        email: data.user.email ?? null,
        role: 'USER',
        status: 'ACTIVE',
      };
    }

    return {
      id: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      phone: profile.phone,
      email: profile.email,
      role: profile.role,
      status: profile.status,
      profileImageUrl: profile.profile_image_url,
    };
  }

  async refreshSession(refreshToken: string) {
    const { data, error } = await this.supabase.anon.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw new UnauthorizedException(error?.message ?? 'Oturum yenilenemedi');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    };
  }

  async signOut(accessToken: string) {
    await this.supabase.admin.auth.admin.signOut(accessToken);
    return { message: 'Çıkış yapıldı' };
  }

  private async getProfile(userId: string) {
    const { data, error } = await this.supabase.admin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return {
        id: userId,
        firstName: 'İTEO',
        lastName: 'Üyesi',
        phone: null,
        email: null,
        role: 'USER',
        status: 'ACTIVE',
      };
    }

    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      email: data.email,
      role: data.role,
      status: data.status,
      profileImageUrl: data.profile_image_url,
    };
  }
}
