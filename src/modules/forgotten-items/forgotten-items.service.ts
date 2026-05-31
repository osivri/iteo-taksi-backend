import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import {
  CreateForgottenItemDto,
  UpdateForgottenItemStatusDto,
} from './dto/forgotten-item.dto';
import { getPagination } from '../../common/dto/pagination-query.dto';

import type { Database } from '../../supabase/database.types';

const PHOTO_BUCKET = 'forgotten-items';

type ForgottenItemStatus = Database['public']['Enums']['forgotten_item_status'];
type ForgottenItemUpdate = Database['public']['Tables']['forgotten_items']['Update'];

function mapForgottenItem(row: Record<string, unknown>, photoUrl?: string | null) {
  return {
    id: row.id as string,
    reporterId: row.reporter_id as string,
    vehicleId: row.vehicle_id as string | null,
    plateNumber: row.plate_number as string,
    description: row.description as string,
    photoPath: row.photo_path as string,
    photoUrl: photoUrl ?? null,
    status: row.status as string,
    adminNote: row.admin_note as string | null,
    reporterName: row.reporter_name as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

@Injectable()
export class ForgottenItemsService {
  constructor(private readonly supabase: SupabaseService) {}

  async list(user: AuthUser, page = 1, limit = 20, status?: ForgottenItemStatus) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);
    const client = this.supabase.createUserClient(user.accessToken);

    let query = client
      .from('forgotten_items')
      .select('*', { count: 'exact' })
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);

    const items = await Promise.all(
      (data ?? []).map(async (row) => {
        const photoUrl = await this.createSignedPhotoUrl(user.accessToken, row.photo_path as string);
        return mapForgottenItem(row, photoUrl);
      }),
    );

    return {
      items,
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async getById(user: AuthUser, id: string) {
    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('forgotten_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Bildirim bulunamadı');
    if (data.reporter_id !== user.id && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Bu bildirime erişim yetkiniz yok');
    }

    const photoUrl = await this.createSignedPhotoUrl(user.accessToken, data.photo_path);
    return mapForgottenItem(data, photoUrl);
  }

  async create(user: AuthUser, dto: CreateForgottenItemDto) {
    if (!['DRIVER', 'PLATE_OWNER'].includes(user.role)) {
      throw new ForbiddenException('Sadece şoförler ve mal sahipleri unutulan eşya bildirebilir');
    }

    if (!dto.photoPath.startsWith(`${user.id}/`)) {
      throw new BadRequestException('Geçersiz fotoğraf yolu');
    }

    const vehicle = await this.resolveVehicle(user, dto.vehicleId);

    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('forgotten_items')
      .insert({
        reporter_id: user.id,
        vehicle_id: vehicle.id,
        plate_number: vehicle.plate_number,
        description: dto.description.trim(),
        photo_path: dto.photoPath,
        status: 'PENDING',
      })
      .select('*')
      .single();

    if (error || !data) throw new BadRequestException(error?.message ?? 'Bildirim oluşturulamadı');

    const { data: reporterProfile } = await this.supabase.admin
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const reporterName = reporterProfile
      ? `${reporterProfile.first_name} ${reporterProfile.last_name}`
      : 'Üye';

    const { data: admins } = await this.supabase.admin
      .from('profiles')
      .select('id')
      .in('role', ['ADMIN', 'SUPER_ADMIN'])
      .eq('status', 'ACTIVE');

    if (admins?.length) {
      await this.supabase.admin.from('notifications').insert(
        admins.map((admin) => ({
          user_id: admin.id,
          title: 'Unutulan eşya bildirimi',
          body: `${reporterName}, ${vehicle.plate_number} plakasında unutulan eşya bildirdi.`,
          type: 'SYSTEM',
        })),
      );
    }

    const photoUrl = await this.createSignedPhotoUrl(user.accessToken, data.photo_path);
    return mapForgottenItem(data, photoUrl);
  }

  async adminList(page = 1, limit = 20, status?: ForgottenItemStatus) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);

    let query = this.supabase.admin
      .from('forgotten_items')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);

    const reporterIds = [...new Set((data ?? []).map((r) => r.reporter_id))];
    const { data: profiles } = await this.supabase.admin
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', reporterIds.length ? reporterIds : ['00000000-0000-0000-0000-000000000000']);

    const nameById = new Map(
      (profiles ?? []).map((p) => [p.id, `${p.first_name} ${p.last_name}`.trim()]),
    );

    const items = await Promise.all(
      (data ?? []).map(async (row) => {
        const photoUrl = await this.createAdminSignedPhotoUrl(row.photo_path as string);
        return mapForgottenItem(
          {
            ...row,
            reporter_name: nameById.get(row.reporter_id),
          },
          photoUrl,
        );
      }),
    );

    return {
      items,
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async adminUpdateStatus(id: string, dto: UpdateForgottenItemStatusDto) {
    const { data: existing, error: fetchError } = await this.supabase.admin
      .from('forgotten_items')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) throw new NotFoundException('Bildirim bulunamadı');

    const payload: ForgottenItemUpdate = {
      status: dto.status,
      updated_at: new Date().toISOString(),
    };
    if (dto.adminNote !== undefined) payload.admin_note = dto.adminNote;

    const { data, error } = await this.supabase.admin
      .from('forgotten_items')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new BadRequestException(error?.message ?? 'Güncellenemedi');

    const statusLabels: Record<string, string> = {
      PENDING: 'Beklemede',
      REVIEWING: 'İnceleniyor',
      RETURNED: 'Teslim edildi',
      CLOSED: 'Kapatıldı',
    };

    await this.supabase.admin.from('notifications').insert({
      user_id: data.reporter_id,
      title: 'Unutulan eşya bildirimi güncellendi',
      body: `${data.plate_number} plakasındaki bildiriminiz "${statusLabels[dto.status] ?? dto.status}" olarak işaretlendi.`,
      type: 'SYSTEM',
    });

    const photoUrl = await this.createAdminSignedPhotoUrl(data.photo_path);
    return mapForgottenItem(data, photoUrl);
  }

  private async resolveVehicle(user: AuthUser, vehicleId: string) {
    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('vehicles')
      .select('id, plate_number, owner_id, active_driver_id')
      .eq('id', vehicleId)
      .maybeSingle();

    if (error || !data) {
      throw new BadRequestException('Seçilen plaka bulunamadı');
    }

    if (user.role === 'PLATE_OWNER' && data.owner_id !== user.id) {
      throw new ForbiddenException('Bu plakaya erişiminiz yok');
    }

    if (user.role === 'DRIVER' && data.active_driver_id !== user.id) {
      throw new ForbiddenException('Bu plakaya erişiminiz yok');
    }

    return data;
  }

  private async createSignedPhotoUrl(accessToken: string, path: string) {
    const client = this.supabase.createUserClient(accessToken);
    const { data, error } = await client.storage
      .from(PHOTO_BUCKET)
      .createSignedUrl(path, 3600);

    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  }

  private async createAdminSignedPhotoUrl(path: string) {
    const { data, error } = await this.supabase.admin.storage
      .from(PHOTO_BUCKET)
      .createSignedUrl(path, 3600);

    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  }
}
