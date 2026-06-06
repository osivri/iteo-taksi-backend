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
  CreateSparePartDto,
  CreateSparePartOrderDto,
  OrderStatus,
  UpdateSparePartDto,
  UpdateSparePartOrderDto,
} from './dto/spare-part.dto';

function mapPart(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | null,
    category: row.category as string,
    price: Number(row.price),
    stock: row.stock as number,
    imageUrl: row.image_url as string | null,
    status: row.status as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapOrder(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    partId: row.part_id as string,
    quantity: row.quantity as number,
    status: row.status as string,
    note: row.note as string | null,
    adminNote: row.admin_note as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    partName: row.part_name as string | undefined,
  };
}

@Injectable()
export class SparePartsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async listActive(user: AuthUser, page = 1, limit = 20, category?: string) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);
    const client = this.supabase.createUserClient(user.accessToken);

    let query = client
      .from('spare_parts')
      .select('*', { count: 'exact' })
      .eq('status', 'ACTIVE')
      .gt('stock', 0)
      .order('name', { ascending: true })
      .range(from, to);

    if (category) query = query.eq('category', category);

    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);

    return {
      items: (data ?? []).map(mapPart),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async createOrder(user: AuthUser, dto: CreateSparePartOrderDto) {
    const client = this.supabase.createUserClient(user.accessToken);

    const { data: part, error: partError } = await client
      .from('spare_parts')
      .select('*')
      .eq('id', dto.partId)
      .eq('status', 'ACTIVE')
      .single();

    if (partError || !part) throw new NotFoundException('Parça bulunamadı');
    if ((part.stock as number) < dto.quantity) {
      throw new BadRequestException('Yetersiz stok');
    }

    const { data, error } = await client
      .from('spare_part_orders')
      .insert({
        user_id: user.id,
        part_id: dto.partId,
        quantity: dto.quantity,
        note: dto.note?.trim() ?? null,
        status: 'PENDING',
      })
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);

    const { data: admins } = await this.supabase.admin
      .from('profiles')
      .select('id')
      .in('role', ['ADMIN', 'SUPER_ADMIN'])
      .eq('status', 'ACTIVE');

    if (admins?.length) {
      await this.supabase.admin.from('notifications').insert(
        admins.map((admin) => ({
          user_id: admin.id,
          title: 'Yedek parça talebi',
          body: `${part.name as string} için yeni talep (${dto.quantity} adet).`,
          type: 'SYSTEM',
        })),
      );
    }

    return mapOrder({ ...data, part_name: part.name });
  }

  async adminListParts(page = 1, limit = 20, category?: string) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);

    let query = this.supabase.admin
      .from('spare_parts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (category) query = query.eq('category', category);

    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);

    return {
      items: (data ?? []).map(mapPart),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async adminCreatePart(admin: AuthUser, dto: CreateSparePartDto) {
    const { data, error } = await this.supabase.admin
      .from('spare_parts')
      .insert({
        name: dto.name.trim(),
        description: dto.description?.trim() ?? null,
        category: dto.category.trim(),
        price: dto.price,
        stock: dto.stock ?? 0,
        image_url: dto.imageUrl ?? null,
        status: dto.status ?? 'ACTIVE',
      })
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);
    await this.audit.log(admin.id, 'CREATE', 'spare_part', data.id as string);
    return mapPart(data);
  }

  async adminUpdatePart(admin: AuthUser, id: string, dto: UpdateSparePartDto) {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (dto.name !== undefined) payload.name = dto.name.trim();
    if (dto.description !== undefined) payload.description = dto.description?.trim() ?? null;
    if (dto.category !== undefined) payload.category = dto.category.trim();
    if (dto.price !== undefined) payload.price = dto.price;
    if (dto.stock !== undefined) payload.stock = dto.stock;
    if (dto.imageUrl !== undefined) payload.image_url = dto.imageUrl;
    if (dto.status !== undefined) payload.status = dto.status;

    const { data, error } = await this.supabase.admin
      .from('spare_parts')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new NotFoundException('Parça bulunamadı');
    await this.audit.log(admin.id, 'UPDATE', 'spare_part', id);
    return mapPart(data);
  }

  async adminDeletePart(admin: AuthUser, id: string) {
    const { error } = await this.supabase.admin.from('spare_parts').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);
    await this.audit.log(admin.id, 'DELETE', 'spare_part', id);
    return { deleted: true };
  }

  async adminListOrders(page = 1, limit = 20, status?: OrderStatus) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);

    let query = this.supabase.admin
      .from('spare_part_orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);

    const partIds = [...new Set((data ?? []).map((r) => r.part_id))];
    const { data: parts } = await this.supabase.admin
      .from('spare_parts')
      .select('id, name')
      .in('id', partIds.length ? partIds : ['00000000-0000-0000-0000-000000000000']);

    const nameById = new Map((parts ?? []).map((p) => [p.id, p.name]));

    return {
      items: (data ?? []).map((row) =>
        mapOrder({ ...row, part_name: nameById.get(row.part_id as string) }),
      ),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async adminUpdateOrder(admin: AuthUser, id: string, dto: UpdateSparePartOrderDto) {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (dto.status !== undefined) payload.status = dto.status;
    if (dto.adminNote !== undefined) payload.admin_note = dto.adminNote;

    const { data, error } = await this.supabase.admin
      .from('spare_part_orders')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new NotFoundException('Sipariş bulunamadı');
    await this.audit.log(admin.id, 'UPDATE', 'spare_part_order', id, {
      status: dto.status,
    });

    if (dto.status) {
      await this.supabase.admin.from('notifications').insert({
        user_id: data.user_id,
        title: 'Yedek parça talebi güncellendi',
        body: `Talebinizin durumu "${dto.status}" olarak güncellendi.`,
        type: 'SYSTEM',
      });
    }

    return mapOrder(data);
  }
}
