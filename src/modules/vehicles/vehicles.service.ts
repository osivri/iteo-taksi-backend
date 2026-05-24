import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import type { Database } from '../../supabase/database.types';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';

type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];

function normalizePlate(plate: string): string {
  return plate.trim().toUpperCase().replace(/\s+/g, ' ');
}

function mapVehicle(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    plateNumber: row.plate_number as string,
    brand: row.brand as string | null,
    model: row.model as string | null,
    year: row.year as number | null,
    ownerId: row.owner_id as string,
    activeDriverId: row.active_driver_id as string | null,
    status: row.status as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapPlateRequest(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    driverId: row.driver_id as string,
    ownerId: row.owner_id as string,
    vehicleId: row.vehicle_id as string,
    plateNumber: row.plate_number as string,
    status: row.status as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

@Injectable()
export class VehiclesService {
  constructor(private readonly supabase: SupabaseService) {}

  async list(user: AuthUser) {
    const client = this.supabase.createUserClient(user.accessToken);
    let query = client.from('vehicles').select('*').order('created_at', { ascending: false });

    if (user.role === 'PLATE_OWNER') {
      query = query.eq('owner_id', user.id);
    } else if (user.role === 'DRIVER') {
      query = query.eq('active_driver_id', user.id);
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return (data ?? []).map(mapVehicle);
  }

  async listPlateRequests(user: AuthUser) {
    const client = this.supabase.createUserClient(user.accessToken);
    let query = client
      .from('driver_plate_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (user.role === 'DRIVER') {
      query = query.eq('driver_id', user.id);
    } else if (user.role === 'PLATE_OWNER') {
      query = query.eq('owner_id', user.id);
    } else if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Yetkiniz yok');
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return (data ?? []).map(mapPlateRequest);
  }

  async getById(user: AuthUser, id: string) {
    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client.from('vehicles').select('*').eq('id', id).single();

    if (error || !data) throw new NotFoundException('Araç bulunamadı');
    return mapVehicle(data);
  }

  async create(user: AuthUser, dto: CreateVehicleDto) {
    if (!['PLATE_OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Plaka kaydı oluşturma yetkisi gerekli');
    }

    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('vehicles')
      .insert({
        plate_number: normalizePlate(dto.plateNumber),
        brand: dto.brand,
        model: dto.model,
        year: dto.year,
        owner_id: user.id,
      })
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);
    return mapVehicle(data);
  }

  async requestPlate(user: AuthUser, plateNumber: string) {
    if (user.role !== 'DRIVER') {
      throw new ForbiddenException('Sadece şoförler plaka onay talebi oluşturabilir');
    }

    const normalized = normalizePlate(plateNumber);
    const client = this.supabase.createUserClient(user.accessToken);

    const { data: vehicle, error: vehicleError } = await this.supabase.admin
      .from('vehicles')
      .select('*')
      .eq('plate_number', normalized)
      .maybeSingle();

    if (vehicleError) throw new BadRequestException(vehicleError.message);
    if (!vehicle) {
      throw new BadRequestException(
        'Bu plaka sistemde kayıtlı değil. Plaka sahibinin önce plakayı kaydetmesi gerekir.',
      );
    }

    if (vehicle.owner_id === user.id) {
      throw new BadRequestException('Kendi plakanız için onay talebi gerekmez');
    }

    if (vehicle.active_driver_id === user.id) {
      throw new BadRequestException('Bu plakada zaten çalışıyorsunuz');
    }

    const { data: pending } = await client
      .from('driver_plate_requests')
      .select('id')
      .eq('driver_id', user.id)
      .eq('vehicle_id', vehicle.id)
      .eq('status', 'PENDING')
      .maybeSingle();

    if (pending) {
      throw new BadRequestException('Bu plaka için zaten onay bekleyen talebiniz var');
    }

    const { data: request, error } = await client
      .from('driver_plate_requests')
      .insert({
        driver_id: user.id,
        owner_id: vehicle.owner_id,
        vehicle_id: vehicle.id,
        plate_number: normalized,
        status: 'PENDING',
      })
      .select('*')
      .single();

    if (error || !request) throw new BadRequestException(error?.message ?? 'Talep oluşturulamadı');

    const { data: driverProfile } = await this.supabase.admin
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const driverName = driverProfile
      ? `${driverProfile.first_name} ${driverProfile.last_name}`
      : 'Bir şoför';

    await this.supabase.admin.from('notifications').insert({
      user_id: vehicle.owner_id,
      title: 'Plaka çalışma onayı',
      body: `${driverName}, ${normalized} plakasında çalışmak için onayınızı bekliyor.`,
      type: 'SYSTEM',
    }).then(({ error }) => {
      if (error) {
        // Bildirim oluşturulamazsa talep yine de kayıtlı kalır
      }
    });

    return mapPlateRequest(request);
  }

  async approvePlateRequest(user: AuthUser, id: string) {
    const client = this.supabase.createUserClient(user.accessToken);
    const { data: request, error } = await client
      .from('driver_plate_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !request) throw new NotFoundException('Talep bulunamadı');
    if (request.owner_id !== user.id && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Bu talebi onaylama yetkiniz yok');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Talep zaten işlenmiş');
    }

    const { error: vehicleError } = await client
      .from('vehicles')
      .update({ active_driver_id: request.driver_id })
      .eq('id', request.vehicle_id);

    if (vehicleError) throw new BadRequestException(vehicleError.message);

    const { data: updated, error: updateError } = await client
      .from('driver_plate_requests')
      .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError || !updated) throw new BadRequestException(updateError?.message ?? 'Onaylanamadı');

    await client
      .from('driver_plate_requests')
      .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
      .eq('vehicle_id', request.vehicle_id)
      .eq('status', 'PENDING')
      .neq('id', id);

    await this.supabase.admin.from('notifications').insert({
      user_id: request.driver_id,
      title: 'Plaka onayı verildi',
      body: `${request.plate_number} plakasında çalışma talebiniz onaylandı.`,
      type: 'SYSTEM',
    });

    return mapPlateRequest(updated);
  }

  async rejectPlateRequest(user: AuthUser, id: string) {
    const client = this.supabase.createUserClient(user.accessToken);
    const { data: request, error } = await client
      .from('driver_plate_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !request) throw new NotFoundException('Talep bulunamadı');
    if (request.owner_id !== user.id && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Bu talebi reddetme yetkiniz yok');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Talep zaten işlenmiş');
    }

    const { data: updated, error: updateError } = await client
      .from('driver_plate_requests')
      .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError || !updated) throw new BadRequestException(updateError?.message ?? 'Reddedilemedi');

    await this.supabase.admin.from('notifications').insert({
      user_id: request.driver_id,
      title: 'Plaka onayı reddedildi',
      body: `${request.plate_number} plakasında çalışma talebiniz reddedildi.`,
      type: 'SYSTEM',
    });

    return mapPlateRequest(updated);
  }

  async update(user: AuthUser, id: string, dto: UpdateVehicleDto) {
    const existing = await this.getById(user, id);
    if (existing.ownerId !== user.id && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Bu aracı güncelleme yetkiniz yok');
    }

    const payload: VehicleUpdate = {};
    if (dto.brand !== undefined) payload.brand = dto.brand;
    if (dto.model !== undefined) payload.model = dto.model;
    if (dto.year !== undefined) payload.year = dto.year;
    if (dto.status !== undefined) payload.status = dto.status;
    if (dto.activeDriverId !== undefined) payload.active_driver_id = dto.activeDriverId;

    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('vehicles')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new BadRequestException(error?.message ?? 'Güncellenemedi');
    return mapVehicle(data);
  }

  async remove(user: AuthUser, id: string) {
    const existing = await this.getById(user, id);
    if (existing.ownerId !== user.id && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Bu aracı silme yetkiniz yok');
    }

    const client = this.supabase.createUserClient(user.accessToken);
    const { error } = await client.from('vehicles').delete().eq('id', id);

    if (error) throw new BadRequestException(error.message);
    return { deleted: true };
  }
}
