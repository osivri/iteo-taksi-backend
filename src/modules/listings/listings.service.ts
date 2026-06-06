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
  CreateListingDto,
  ListingStatus,
  ListingType,
  UpdateListingStatusDto,
} from './dto/listing.dto';

function mapListing(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as string,
    status: row.status as string,
    title: row.title as string,
    description: row.description as string | null,
    price: Number(row.price),
    district: row.district as string | null,
    neighborhood: row.neighborhood as string | null,
    photos: (row.photos as string[]) ?? [],
    contactPhone: row.contact_phone as string | null,
    adminNote: row.admin_note as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

@Injectable()
export class ListingsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async create(user: AuthUser, dto: CreateListingDto) {
    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('classified_listings')
      .insert({
        user_id: user.id,
        type: dto.type,
        title: dto.title.trim(),
        description: dto.description?.trim() ?? null,
        price: dto.price,
        district: dto.district?.trim() ?? null,
        neighborhood: dto.neighborhood?.trim() ?? null,
        photos: dto.photos ?? [],
        contact_phone: dto.contactPhone?.trim() ?? null,
        status: 'PENDING',
      })
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);
    return mapListing(data);
  }

  async listMine(user: AuthUser, page = 1, limit = 20) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);
    const client = this.supabase.createUserClient(user.accessToken);

    const { data, error, count } = await client
      .from('classified_listings')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new BadRequestException(error.message);

    return {
      items: (data ?? []).map(mapListing),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async listPublic(
    user: AuthUser,
    page = 1,
    limit = 20,
    type?: ListingType,
    district?: string,
    neighborhood?: string,
  ) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);
    const client = this.supabase.createUserClient(user.accessToken);

    let query = client
      .from('classified_listings')
      .select('*', { count: 'exact' })
      .eq('status', 'APPROVED')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (type) query = query.eq('type', type);
    if (district) query = query.ilike('district', `%${district}%`);
    if (neighborhood) query = query.ilike('neighborhood', `%${neighborhood}%`);

    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);

    return {
      items: (data ?? []).map(mapListing),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async adminList(
    page = 1,
    limit = 20,
    type?: ListingType,
    status?: ListingStatus,
    district?: string,
    neighborhood?: string,
  ) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);

    let query = this.supabase.admin
      .from('classified_listings')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    if (district) query = query.ilike('district', `%${district}%`);
    if (neighborhood) query = query.ilike('neighborhood', `%${neighborhood}%`);

    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);

    return {
      items: (data ?? []).map(mapListing),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async adminUpdateStatus(admin: AuthUser, id: string, dto: UpdateListingStatusDto) {
    const payload: Record<string, unknown> = {
      status: dto.status,
      updated_at: new Date().toISOString(),
    };
    if (dto.adminNote !== undefined) payload.admin_note = dto.adminNote;

    const { data, error } = await this.supabase.admin
      .from('classified_listings')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new NotFoundException('İlan bulunamadı');

    await this.audit.log(admin.id, 'UPDATE_STATUS', 'classified_listing', id, {
      status: dto.status,
    });

    const statusLabel = dto.status === 'APPROVED' ? 'onaylandı' : 'reddedildi';
    await this.supabase.admin.from('notifications').insert({
      user_id: data.user_id,
      title: 'İlan durumu güncellendi',
      body: `"${data.title as string}" başlıklı ilanınız ${statusLabel}.`,
      type: 'SYSTEM',
    });

    return mapListing(data);
  }
}
