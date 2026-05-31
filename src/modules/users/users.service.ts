import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { mapProfile } from '../../common/interfaces/auth-user.interface';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { UpdateProfileDto, AdminUpdateUserDto } from './dto/update-profile.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { RegisterPushTokenDto } from './dto/push-token.dto';
import { PushService } from '../push/push.service';
import { getPagination } from '../../common/dto/pagination-query.dto';
import type { Database } from '../../supabase/database.types';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

@Injectable()
export class UsersService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly pushService: PushService,
  ) {}

  async getMe(user: AuthUser) {
    return mapProfile(user.profile);
  }

  async updateMe(user: AuthUser, dto: UpdateProfileDto) {
    const payload: ProfileUpdate = {};
    if (dto.firstName !== undefined) payload.first_name = dto.firstName;
    if (dto.lastName !== undefined) payload.last_name = dto.lastName;
    if (dto.phone !== undefined) payload.phone = dto.phone;
    if (dto.email !== undefined) payload.email = dto.email;
    if (dto.nationalId !== undefined) payload.national_id = dto.nationalId;
    if (dto.memberNo !== undefined) payload.member_no = dto.memberNo;
    if (dto.profileImageUrl !== undefined) payload.profile_image_url = dto.profileImageUrl;
    if (dto.city !== undefined) payload.city = dto.city;
    if (dto.district !== undefined) payload.district = dto.district;
    if (dto.addressLine !== undefined) payload.address_line = dto.addressLine;

    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select('*')
      .single();

    if (error || !data) {
      throw new BadRequestException(error?.message ?? 'Profil güncellenemedi');
    }

    return mapProfile(data);
  }

  async completeOnboarding(user: AuthUser, dto: CompleteOnboardingDto) {
    const client = this.supabase.createUserClient(user.accessToken);
    const payload = {
      first_name: dto.firstName,
      last_name: dto.lastName,
      role: dto.role,
      status: 'ACTIVE' as const,
      email: user.email ?? user.profile.email,
      city: dto.city.trim(),
      district: dto.district.trim(),
      address_line: dto.addressLine.trim(),
    };

    const { data: updated, error: updateError } = await client
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select('*')
      .maybeSingle();

    if (updated) {
      return mapProfile(updated);
    }

    const { data: inserted, error: insertError } = await client
      .from('profiles')
      .insert({
        id: user.id,
        ...payload,
      })
      .select('*')
      .single();

    if (inserted) {
      return mapProfile(inserted);
    }

    if (this.supabase.hasServiceRole()) {
      const { data, error } = await this.supabase.admin
        .from('profiles')
        .upsert(
          {
            id: user.id,
            ...payload,
          },
          { onConflict: 'id' },
        )
        .select('*')
        .single();

      if (data) {
        return mapProfile(data);
      }

      throw new BadRequestException(error?.message ?? 'Profil tamamlanamadı');
    }

    throw new BadRequestException(
      updateError?.message ?? insertError?.message ?? 'Profil tamamlanamadı',
    );
  }

  async registerPushToken(user: AuthUser, dto: RegisterPushTokenDto) {
    await this.pushService.registerToken(user.id, dto.token, dto.platform);
    return { registered: true };
  }

  async acceptKvkk(user: AuthUser) {
    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('profiles')
      .update({ kvkk_accepted_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('*')
      .single();

    if (error || !data) {
      throw new BadRequestException(error?.message ?? 'KVKK onayı kaydedilemedi');
    }

    return mapProfile(data);
  }

  async listUsers(page = 1, limit = 20, search?: string) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);

    let query = this.supabase.admin
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      items: (data ?? []).map(mapProfile),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async getUserById(id: string) {
    const { data, error } = await this.supabase.admin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    return mapProfile(data);
  }

  async adminUpdateUser(id: string, dto: AdminUpdateUserDto) {
    const payload: ProfileUpdate = {};
    if (dto.firstName !== undefined) payload.first_name = dto.firstName;
    if (dto.lastName !== undefined) payload.last_name = dto.lastName;
    if (dto.role !== undefined) payload.role = dto.role;
    if (dto.status !== undefined) payload.status = dto.status;

    const { data, error } = await this.supabase.admin
      .from('profiles')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      throw new BadRequestException(error?.message ?? 'Kullanıcı güncellenemedi');
    }

    return mapProfile(data);
  }
}
