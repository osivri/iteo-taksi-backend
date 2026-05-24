import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateNewsDto, UpdateNewsDto } from './dto/news.dto';
import { getPagination } from '../../common/dto/pagination-query.dto';

function mapNews(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    title: row.title as string,
    summary: row.summary as string,
    content: row.content as string,
    category: row.category as string,
    coverImageUrl: row.cover_image_url as string | null,
    isPublished: row.is_published as boolean,
    publishedAt: row.published_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

@Injectable()
export class NewsService {
  constructor(private readonly supabase: SupabaseService) {}

  async listPublic(user: AuthUser, page = 1, limit = 20, category?: string) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);
    const client = this.supabase.createUserClient(user.accessToken);

    let query = client
      .from('news')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .range(from, to);

    if (category) query = query.eq('category', category);

    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);

    return {
      items: (data ?? []).map(mapNews),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async getPublic(user: AuthUser, id: string) {
    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('news')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (error || !data) throw new NotFoundException('Haber bulunamadı');
    return mapNews(data);
  }

  async adminList(page = 1, limit = 20) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);
    const { data, error, count } = await this.supabase.admin
      .from('news')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new BadRequestException(error.message);
    return {
      items: (data ?? []).map(mapNews),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async adminCreate(dto: CreateNewsDto) {
    const { data, error } = await this.supabase.admin
      .from('news')
      .insert({
        title: dto.title,
        summary: dto.summary,
        content: dto.content,
        category: dto.category,
        cover_image_url: dto.coverImageUrl,
        is_published: dto.isPublished ?? false,
        published_at: dto.isPublished ? (dto.publishedAt ?? new Date().toISOString()) : dto.publishedAt,
      })
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);
    return mapNews(data);
  }

  async adminUpdate(id: string, dto: UpdateNewsDto) {
    const payload: Record<string, unknown> = {};
    if (dto.title !== undefined) payload.title = dto.title;
    if (dto.summary !== undefined) payload.summary = dto.summary;
    if (dto.content !== undefined) payload.content = dto.content;
    if (dto.category !== undefined) payload.category = dto.category;
    if (dto.coverImageUrl !== undefined) payload.cover_image_url = dto.coverImageUrl;
    if (dto.isPublished !== undefined) {
      payload.is_published = dto.isPublished;
      if (dto.isPublished && !dto.publishedAt) payload.published_at = new Date().toISOString();
    }
    if (dto.publishedAt !== undefined) payload.published_at = dto.publishedAt;

    const { data, error } = await this.supabase.admin
      .from('news')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new NotFoundException('Haber bulunamadı');
    return mapNews(data);
  }

  async adminDelete(id: string) {
    const { error } = await this.supabase.admin.from('news').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);
    return { deleted: true };
  }
}
