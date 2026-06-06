import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { getPagination } from '../../common/dto/pagination-query.dto';
import { AuditService } from '../audit/audit.service';
import {
  CreateStandDto,
  StandStatus,
  UpdateStandDto,
} from './dto/stand.dto';

function mapStand(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    district: row.district as string,
    neighborhood: row.neighborhood as string | null,
    addressLine: row.address_line as string | null,
    status: row.status as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

@Injectable()
export class StandsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async list(user: AuthUser, page = 1, limit = 20, status?: StandStatus, district?: string) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);
    const client = this.supabase.createUserClient(user.accessToken);

    let query = client
      .from('taxi_stands')
      .select('*', { count: 'exact' })
      .eq('status', status ?? 'ACTIVE')
      .order('name', { ascending: true })
      .range(from, to);

    if (district) query = query.ilike('district', `%${district}%`);

    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);

    return {
      items: (data ?? []).map(mapStand),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async adminList(page = 1, limit = 20, status?: StandStatus, district?: string) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);

    let query = this.supabase.admin
      .from('taxi_stands')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);
    if (district) query = query.ilike('district', `%${district}%`);

    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);

    return {
      items: (data ?? []).map(mapStand),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async adminGetById(id: string) {
    const { data, error } = await this.supabase.admin
      .from('taxi_stands')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Durak bulunamadı');
    return mapStand(data);
  }

  async adminCreate(admin: AuthUser, dto: CreateStandDto) {
    const { data, error } = await this.supabase.admin
      .from('taxi_stands')
      .insert({
        name: dto.name.trim(),
        district: dto.district.trim(),
        neighborhood: dto.neighborhood?.trim() ?? null,
        address_line: dto.addressLine?.trim() ?? null,
        status: dto.status ?? 'ACTIVE',
      })
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);
    await this.audit.log(admin.id, 'CREATE', 'taxi_stand', data.id as string);
    return mapStand(data);
  }

  async adminUpdate(admin: AuthUser, id: string, dto: UpdateStandDto) {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (dto.name !== undefined) payload.name = dto.name.trim();
    if (dto.district !== undefined) payload.district = dto.district.trim();
    if (dto.neighborhood !== undefined) payload.neighborhood = dto.neighborhood?.trim() ?? null;
    if (dto.addressLine !== undefined) payload.address_line = dto.addressLine?.trim() ?? null;
    if (dto.status !== undefined) payload.status = dto.status;

    const { data, error } = await this.supabase.admin
      .from('taxi_stands')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new NotFoundException('Durak bulunamadı');
    await this.audit.log(admin.id, 'UPDATE', 'taxi_stand', id);
    return mapStand(data);
  }

  async adminDelete(admin: AuthUser, id: string) {
    const { error } = await this.supabase.admin.from('taxi_stands').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);
    await this.audit.log(admin.id, 'DELETE', 'taxi_stand', id);
    return { deleted: true };
  }
}
