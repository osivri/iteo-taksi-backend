import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from './dto/appointment.dto';
import { getPagination } from '../../common/dto/pagination-query.dto';

function mapAppointment(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as string,
    status: row.status as string,
    requestedDate: row.requested_date as string,
    requestedTime: row.requested_time as string | null,
    description: row.description as string | null,
    adminNote: row.admin_note as string | null,
    checkInDate: row.check_in_date as string | null,
    checkOutDate: row.check_out_date as string | null,
    guestCount: row.guest_count as number | null,
    roomType: row.room_type as string | null,
    vehicleId: row.vehicle_id as string | null,
    plateNumber: row.plate_number as string | null,
    serviceType: row.service_type as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

@Injectable()
export class AppointmentsService {
  constructor(private readonly supabase: SupabaseService) {}

  async list(user: AuthUser, page = 1, limit = 20, type?: string, status?: string) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);
    const client = this.supabase.createUserClient(user.accessToken);

    let query = client
      .from('appointments')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);

    return {
      items: (data ?? []).map(mapAppointment),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async getById(user: AuthUser, id: string) {
    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client.from('appointments').select('*').eq('id', id).single();

    if (error || !data) throw new NotFoundException('Randevu bulunamadı');
    return mapAppointment(data);
  }

  async create(user: AuthUser, dto: CreateAppointmentDto) {
    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('appointments')
      .insert({
        user_id: user.id,
        type: dto.type,
        status: 'PENDING',
        requested_date: dto.requestedDate,
        requested_time: dto.requestedTime,
        description: dto.description,
        check_in_date: dto.checkInDate,
        check_out_date: dto.checkOutDate,
        guest_count: dto.guestCount,
        room_type: dto.roomType,
        vehicle_id: dto.vehicleId,
        plate_number: dto.plateNumber,
        service_type: dto.serviceType,
      })
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);
    return mapAppointment(data);
  }

  async cancel(user: AuthUser, id: string) {
    const existing = await this.getById(user, id);
    if (existing.userId !== user.id) {
      throw new ForbiddenException('Bu randevuyu iptal etme yetkiniz yok');
    }
    if (['COMPLETED', 'CANCELLED'].includes(existing.status)) {
      throw new BadRequestException('Bu randevu iptal edilemez');
    }

    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('appointments')
      .update({ status: 'CANCELLED' })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new BadRequestException(error?.message ?? 'İptal edilemedi');
    return mapAppointment(data);
  }

  async adminList(page = 1, limit = 20, type?: string, status?: string) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);

    let query = this.supabase.admin
      .from('appointments')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);

    return {
      items: (data ?? []).map(mapAppointment),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async adminUpdateStatus(id: string, dto: UpdateAppointmentStatusDto) {
    const payload: Record<string, unknown> = { status: dto.status };
    if (dto.adminNote !== undefined) payload.admin_note = dto.adminNote;

    const { data, error } = await this.supabase.admin
      .from('appointments')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new NotFoundException('Randevu bulunamadı');
    return mapAppointment(data);
  }
}
