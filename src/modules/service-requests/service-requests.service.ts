import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { getPagination } from '../../common/dto/pagination-query.dto';
import { AuditService } from '../audit/audit.service';
import {
  CreateServiceRequestDto,
  ServiceRequestType,
  UpdateServiceRequestStatusDto,
} from './dto/service-request.dto';

function mapRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as string,
    status: row.status as string,
    title: row.title as string,
    description: row.description as string | null,
    plateNumber: row.plate_number as string | null,
    vehicleId: row.vehicle_id as string | null,
    locationAddress: row.location_address as string | null,
    locationLat: row.location_lat as number | null,
    locationLng: row.location_lng as number | null,
    assignedTo: row.assigned_to as string | null,
    adminNote: row.admin_note as string | null,
    metadata: row.metadata as Record<string, unknown>,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

@Injectable()
export class ServiceRequestsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async create(user: AuthUser, dto: CreateServiceRequestDto) {
    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('service_requests')
      .insert({
        user_id: user.id,
        type: dto.type,
        title: dto.title,
        description: dto.description ?? null,
        plate_number: dto.plateNumber?.trim().toUpperCase() ?? null,
        vehicle_id: dto.vehicleId ?? null,
        location_address: dto.locationAddress ?? null,
        location_lat: dto.locationLat ?? null,
        location_lng: dto.locationLng ?? null,
      })
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);
    await this.audit.log(user.id, 'CREATE', 'service_request', data.id as string, { type: dto.type });
    return mapRow(data);
  }

  async listMine(user: AuthUser, page = 1, limit = 20, type?: ServiceRequestType) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);
    const client = this.supabase.createUserClient(user.accessToken);
    let query = client
      .from('service_requests')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (type) query = query.eq('type', type);
    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);
    return {
      items: (data ?? []).map(mapRow),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async adminList(page = 1, limit = 20, type?: ServiceRequestType, status?: string) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);
    let query = this.supabase.admin
      .from('service_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);
    return {
      items: (data ?? []).map(mapRow),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async adminUpdateStatus(admin: AuthUser, id: string, dto: UpdateServiceRequestStatusDto) {
    const payload: Record<string, unknown> = {
      status: dto.status,
      updated_at: new Date().toISOString(),
    };
    if (dto.assignedTo !== undefined) payload.assigned_to = dto.assignedTo;
    if (dto.adminNote !== undefined) payload.admin_note = dto.adminNote;

    const { data, error } = await this.supabase.admin
      .from('service_requests')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new NotFoundException('Talep bulunamadı');
    await this.audit.log(admin.id, 'UPDATE_STATUS', 'service_request', id, {
      status: dto.status,
    });
    return mapRow(data);
  }

  async cancel(user: AuthUser, id: string) {
    const client = this.supabase.createUserClient(user.accessToken);
    const { data: existing, error: fetchError } = await client
      .from('service_requests')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError || !existing) throw new NotFoundException('Talep bulunamadı');
    if (existing.user_id !== user.id) throw new ForbiddenException('Yetkisiz');
    if (existing.status !== 'PENDING') {
      throw new BadRequestException('Yalnızca bekleyen talepler iptal edilebilir');
    }
    const { data, error } = await client
      .from('service_requests')
      .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    return mapRow(data);
  }
}
