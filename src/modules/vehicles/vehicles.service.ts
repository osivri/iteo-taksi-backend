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
    standId: row.stand_id as string | null,
    inspectionExpiry: row.inspection_expiry as string | null,
    insuranceExpiry: row.insurance_expiry as string | null,
    licenseExpiry: row.license_expiry as string | null,
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
    initiatedBy: (row.initiated_by as string) ?? 'DRIVER',
    driverName: row.driver_name as string | undefined,
    ownerName: row.owner_name as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapAvailableVehicle(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    plateNumber: row.plate_number as string,
    brand: row.brand as string | null,
    model: row.model as string | null,
    year: row.year as number | null,
    ownerId: row.owner_id as string,
    ownerName: row.owner_name as string,
    status: row.status as string,
    hasPendingRequest: Boolean(row.has_pending_request),
  };
}

function mapAvailableDriver(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    fullName: `${row.first_name as string} ${row.last_name as string}`.trim(),
    memberNo: row.member_no as string | null,
    phone: row.phone as string | null,
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

    const rows = data ?? [];
    const profileIds = [
      ...new Set(rows.flatMap((r) => [r.driver_id, r.owner_id])),
    ];

    const { data: profiles } = await this.supabase.admin
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', profileIds.length ? profileIds : ['00000000-0000-0000-0000-000000000000']);

    const nameById = new Map(
      (profiles ?? []).map((p) => [p.id, `${p.first_name} ${p.last_name}`.trim()]),
    );

    return rows.map((row) =>
      mapPlateRequest({
        ...row,
        driver_name: nameById.get(row.driver_id),
        owner_name: nameById.get(row.owner_id),
      }),
    );
  }

  async listAvailableVehicles(user: AuthUser) {
    if (user.role !== 'DRIVER') {
      throw new ForbiddenException('Sadece şoförler boş araçları görüntüleyebilir');
    }

    const { data: vehicles, error } = await this.supabase.admin
      .from('vehicles')
      .select('id, plate_number, brand, model, year, owner_id, status')
      .is('active_driver_id', null)
      .eq('status', 'ACTIVE')
      .neq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);

    const ownerIds = [...new Set((vehicles ?? []).map((v) => v.owner_id))];
    const { data: owners } = await this.supabase.admin
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', ownerIds.length ? ownerIds : ['00000000-0000-0000-0000-000000000000']);

    const ownerNameById = new Map(
      (owners ?? []).map((o) => [o.id, `${o.first_name} ${o.last_name}`.trim()]),
    );

    const { data: pendingRequests } = await this.supabase.admin
      .from('driver_plate_requests')
      .select('vehicle_id')
      .eq('driver_id', user.id)
      .eq('status', 'PENDING');

    const pendingVehicleIds = new Set((pendingRequests ?? []).map((r) => r.vehicle_id));

    return (vehicles ?? []).map((v) =>
      mapAvailableVehicle({
        ...v,
        owner_name: ownerNameById.get(v.owner_id) ?? 'Mal Sahibi',
        has_pending_request: pendingVehicleIds.has(v.id),
      }),
    );
  }

  async listAvailableDrivers(user: AuthUser) {
    if (user.role !== 'PLATE_OWNER') {
      throw new ForbiddenException('Sadece mal sahipleri boşta şoförleri görüntüleyebilir');
    }

    const { data: assignedDrivers } = await this.supabase.admin
      .from('vehicles')
      .select('active_driver_id')
      .not('active_driver_id', 'is', null)
      .eq('status', 'ACTIVE');

    const assignedIds = new Set(
      (assignedDrivers ?? []).map((v) => v.active_driver_id).filter(Boolean) as string[],
    );

    let query = this.supabase.admin
      .from('profiles')
      .select('id, first_name, last_name, member_no, phone')
      .eq('role', 'DRIVER')
      .eq('status', 'ACTIVE')
      .order('first_name', { ascending: true });

    if (assignedIds.size > 0) {
      query = query.not('id', 'in', `(${[...assignedIds].join(',')})`);
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);

    return (data ?? []).map(mapAvailableDriver);
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
        stand_id: dto.standId ?? null,
        inspection_expiry: dto.inspectionExpiry ?? null,
        insurance_expiry: dto.insuranceExpiry ?? null,
        license_expiry: dto.licenseExpiry ?? null,
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
    const vehicle = await this.findVehicleForDriverRequest(user, normalized);
    return this.createDriverPlateRequest(user, vehicle, 'DRIVER');
  }

  async requestPlateByVehicle(user: AuthUser, vehicleId: string) {
    if (user.role !== 'DRIVER') {
      throw new ForbiddenException('Sadece şoförler araç başvurusu yapabilir');
    }

    const { data: vehicle, error } = await this.supabase.admin
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    if (!vehicle) throw new NotFoundException('Araç bulunamadı');

    return this.createDriverPlateRequest(user, vehicle, 'DRIVER');
  }

  async inviteDriver(user: AuthUser, vehicleId: string, driverId: string) {
    if (user.role !== 'PLATE_OWNER') {
      throw new ForbiddenException('Sadece mal sahipleri şoför davet edebilir');
    }

    const { data: vehicle, error: vehicleError } = await this.supabase.admin
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .maybeSingle();

    if (vehicleError) throw new BadRequestException(vehicleError.message);
    if (!vehicle) throw new NotFoundException('Araç bulunamadı');
    if (vehicle.owner_id !== user.id) {
      throw new ForbiddenException('Bu araca şoför davet etme yetkiniz yok');
    }
    if (vehicle.active_driver_id) {
      throw new BadRequestException('Bu aracın zaten atanmış bir şoförü var');
    }

    const { data: driver, error: driverError } = await this.supabase.admin
      .from('profiles')
      .select('id, first_name, last_name, role, status')
      .eq('id', driverId)
      .maybeSingle();

    if (driverError) throw new BadRequestException(driverError.message);
    if (!driver || driver.role !== 'DRIVER' || driver.status !== 'ACTIVE') {
      throw new BadRequestException('Geçerli bir boşta şoför bulunamadı');
    }

    const { data: assigned } = await this.supabase.admin
      .from('vehicles')
      .select('id')
      .eq('active_driver_id', driverId)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (assigned) {
      throw new BadRequestException('Bu şoför başka bir plakada çalışıyor');
    }

    const client = this.supabase.createUserClient(user.accessToken);
    const { data: pending } = await client
      .from('driver_plate_requests')
      .select('id')
      .eq('driver_id', driverId)
      .eq('vehicle_id', vehicle.id)
      .eq('status', 'PENDING')
      .maybeSingle();

    if (pending) {
      throw new BadRequestException('Bu şoföre zaten bekleyen bir davet var');
    }

    const { data: request, error } = await client
      .from('driver_plate_requests')
      .insert({
        driver_id: driverId,
        owner_id: user.id,
        vehicle_id: vehicle.id,
        plate_number: vehicle.plate_number,
        status: 'PENDING',
        initiated_by: 'OWNER',
      })
      .select('*')
      .single();

    if (error || !request) throw new BadRequestException(error?.message ?? 'Davet oluşturulamadı');

    const { data: ownerProfile } = await this.supabase.admin
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const ownerName = ownerProfile
      ? `${ownerProfile.first_name} ${ownerProfile.last_name}`
      : 'Bir plaka sahibi';

    await this.supabase.admin.from('notifications').insert({
      user_id: driverId,
      title: 'Plaka çalışma daveti',
      body: `${ownerName}, ${vehicle.plate_number} plakasında çalışmanız için sizi davet ediyor.`,
      type: 'SYSTEM',
    });

    return mapPlateRequest(request);
  }

  private async findVehicleForDriverRequest(user: AuthUser, normalized: string) {
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

    return vehicle;
  }

  private async createDriverPlateRequest(
    user: AuthUser,
    vehicle: Record<string, unknown>,
    initiatedBy: 'DRIVER' | 'OWNER',
  ) {
    if (vehicle.owner_id === user.id) {
      throw new BadRequestException('Kendi plakanız için onay talebi gerekmez');
    }

    if (vehicle.active_driver_id === user.id) {
      throw new BadRequestException('Bu plakada zaten çalışıyorsunuz');
    }

    if (vehicle.active_driver_id) {
      throw new BadRequestException('Bu aracın zaten atanmış bir şoförü var');
    }

    const client = this.supabase.createUserClient(user.accessToken);

    const { data: pending } = await client
      .from('driver_plate_requests')
      .select('id')
      .eq('driver_id', user.id)
      .eq('vehicle_id', vehicle.id as string)
      .eq('status', 'PENDING')
      .maybeSingle();

    if (pending) {
      throw new BadRequestException('Bu araç için zaten bekleyen talebiniz var');
    }

    const { data: request, error } = await client
      .from('driver_plate_requests')
      .insert({
        driver_id: user.id,
        owner_id: vehicle.owner_id as string,
        vehicle_id: vehicle.id as string,
        plate_number: vehicle.plate_number as string,
        status: 'PENDING',
        initiated_by: initiatedBy,
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
      user_id: vehicle.owner_id as string,
      title: 'Plaka çalışma onayı',
      body: `${driverName}, ${vehicle.plate_number as string} plakasında çalışmak için onayınızı bekliyor.`,
      type: 'SYSTEM',
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
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Talep zaten işlenmiş');
    }

    const initiatedBy = (request.initiated_by as string) ?? 'DRIVER';
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

    if (initiatedBy === 'DRIVER') {
      if (request.owner_id !== user.id && !isAdmin) {
        throw new ForbiddenException('Bu talebi onaylama yetkiniz yok');
      }
    } else if (initiatedBy === 'OWNER') {
      if (request.driver_id !== user.id && !isAdmin) {
        throw new ForbiddenException('Bu daveti kabul etme yetkiniz yok');
      }
    }

    return this.finalizePlateRequestApproval(client, request);
  }

  async rejectPlateRequest(user: AuthUser, id: string) {
    const client = this.supabase.createUserClient(user.accessToken);
    const { data: request, error } = await client
      .from('driver_plate_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !request) throw new NotFoundException('Talep bulunamadı');
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Talep zaten işlenmiş');
    }

    const initiatedBy = (request.initiated_by as string) ?? 'DRIVER';
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

    if (initiatedBy === 'DRIVER') {
      if (request.owner_id !== user.id && !isAdmin) {
        throw new ForbiddenException('Bu talebi reddetme yetkiniz yok');
      }
    } else if (initiatedBy === 'OWNER') {
      if (request.driver_id !== user.id && !isAdmin) {
        throw new ForbiddenException('Bu daveti reddetme yetkiniz yok');
      }
    }

    const { data: updated, error: updateError } = await client
      .from('driver_plate_requests')
      .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError || !updated) throw new BadRequestException(updateError?.message ?? 'Reddedilemedi');

    const notifyUserId = initiatedBy === 'DRIVER' ? request.driver_id : request.owner_id;
    const rejectMessage =
      initiatedBy === 'DRIVER'
        ? `${request.plate_number} plakasında çalışma talebiniz reddedildi.`
        : `${request.plate_number} plakası için şoför davetiniz reddedildi.`;

    await this.supabase.admin.from('notifications').insert({
      user_id: notifyUserId,
      title: initiatedBy === 'DRIVER' ? 'Plaka onayı reddedildi' : 'Plaka daveti reddedildi',
      body: rejectMessage,
      type: 'SYSTEM',
    });

    return mapPlateRequest(updated);
  }

  private async finalizePlateRequestApproval(
    client: ReturnType<SupabaseService['createUserClient']>,
    request: Record<string, unknown>,
  ) {
    const requestId = request.id as string;
    const vehicleId = request.vehicle_id as string;
    const driverId = request.driver_id as string;
    const plateNumber = request.plate_number as string;
    const initiatedBy = (request.initiated_by as string) ?? 'DRIVER';

    const { data: vehicle } = await this.supabase.admin
      .from('vehicles')
      .select('active_driver_id')
      .eq('id', vehicleId)
      .single();

    if (vehicle?.active_driver_id && vehicle.active_driver_id !== driverId) {
      throw new BadRequestException('Bu aracın zaten atanmış bir şoförü var');
    }

    const { error: vehicleError } = await client
      .from('vehicles')
      .update({ active_driver_id: driverId })
      .eq('id', vehicleId);

    if (vehicleError) throw new BadRequestException(vehicleError.message);

    const { data: updated, error: updateError } = await client
      .from('driver_plate_requests')
      .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select('*')
      .single();

    if (updateError || !updated) throw new BadRequestException(updateError?.message ?? 'Onaylanamadı');

    await client
      .from('driver_plate_requests')
      .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
      .eq('vehicle_id', vehicleId)
      .eq('status', 'PENDING')
      .neq('id', requestId);

    const notifyUserId = initiatedBy === 'DRIVER' ? driverId : (request.owner_id as string);
    const approveMessage =
      initiatedBy === 'DRIVER'
        ? `${plateNumber} plakasında çalışma talebiniz onaylandı.`
        : `${plateNumber} plakasında çalışma davetiniz kabul edildi.`;

    await this.supabase.admin.from('notifications').insert({
      user_id: notifyUserId,
      title: 'Plaka eşleşmesi tamamlandı',
      body: approveMessage,
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
    if (dto.standId !== undefined) payload.stand_id = dto.standId;
    if (dto.inspectionExpiry !== undefined) payload.inspection_expiry = dto.inspectionExpiry;
    if (dto.insuranceExpiry !== undefined) payload.insurance_expiry = dto.insuranceExpiry;
    if (dto.licenseExpiry !== undefined) payload.license_expiry = dto.licenseExpiry;

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
