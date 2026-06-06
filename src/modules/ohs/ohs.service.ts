import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateOhsContentDto, UpdateOhsContentDto } from './dto/ohs.dto';
import { getPagination } from '../../common/dto/pagination-query.dto';
import { chunkOhsContent, rankRagChunks, composeRagAnswer } from './rag.util';

const OUT_OF_SCOPE_REPLY =
  'Bu konu İSG kapsamı dışındadır. Lütfen oda yetkilisine danışınız.';
const NO_MATCH_REPLY =
  'Bu konuda yeterli bilgi bulamadım. Lütfen oda yetkilisine danışmanız gerekir.';

function mapOhs(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | null,
    type: row.type as string,
    category: row.category as string,
    videoUrl: row.video_url as string | null,
    body: row.body as string | null,
    isPublished: row.is_published as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

type RagChunk = ReturnType<typeof chunkOhsContent>[number];

@Injectable()
export class OhsService {
  private ragChunksCache: { chunks: RagChunk[]; loadedAt: number } | null = null;
  private readonly ragCacheTtlMs = 5 * 60 * 1000;

  constructor(private readonly supabase: SupabaseService) {}

  private invalidateRagCache(): void {
    this.ragChunksCache = null;
  }

  private async loadRagChunks(): Promise<RagChunk[]> {
    if (
      this.ragChunksCache &&
      Date.now() - this.ragChunksCache.loadedAt < this.ragCacheTtlMs
    ) {
      return this.ragChunksCache.chunks;
    }

    const { data: contents } = await this.supabase.admin
      .from('ohs_contents')
      .select('*')
      .eq('is_published', true)
      .in('type', ['FAQ', 'GUIDE', 'ARTICLE']);

    const chunks = (contents ?? []).flatMap((item) =>
      chunkOhsContent({
        id: item.id as string,
        title: item.title as string,
        type: item.type as string,
        category: item.category as string,
        description: item.description as string | null,
        body: item.body as string | null,
      }),
    );

    this.ragChunksCache = { chunks, loadedAt: Date.now() };
    return chunks;
  }

  async listPublic(user: AuthUser, page = 1, limit = 20, type?: string, category?: string) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);
    const client = this.supabase.createUserClient(user.accessToken);

    let query = client
      .from('ohs_contents')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (type) query = query.eq('type', type);
    if (category) query = query.eq('category', category);

    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);

    return {
      items: (data ?? []).map(mapOhs),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async getPublic(user: AuthUser, id: string) {
    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('ohs_contents')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (error || !data) throw new NotFoundException('İSG içeriği bulunamadı');
    return mapOhs(data);
  }

  async chat(user: AuthUser, message: string) {
    const normalized = message.toLowerCase().trim();
    const blockedKeywords = ['dava', 'mahkeme', 'teşhis', 'tedavi', 'ilaç', 'doktor'];
    if (blockedKeywords.some((k) => normalized.includes(k))) {
      return { answer: OUT_OF_SCOPE_REPLY, matched: false, sources: [] };
    }

    const chunks = await this.loadRagChunks();
    const matches = rankRagChunks(chunks, message, 3);
    if (matches.length === 0) {
      return { answer: NO_MATCH_REPLY, matched: false, sources: [] };
    }

    const answer = composeRagAnswer(matches);
    return {
      answer,
      matched: true,
      mode: 'rag',
      sources: matches.map((m) => ({
        id: m.chunk.contentId,
        title: m.chunk.title,
        type: m.chunk.type,
        category: m.chunk.category,
        score: m.score,
      })),
    };
  }

  async adminList(page = 1, limit = 20) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);
    const { data, error, count } = await this.supabase.admin
      .from('ohs_contents')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new BadRequestException(error.message);
    return {
      items: (data ?? []).map(mapOhs),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async adminCreate(dto: CreateOhsContentDto) {
    const { data, error } = await this.supabase.admin
      .from('ohs_contents')
      .insert({
        title: dto.title,
        description: dto.description,
        type: dto.type,
        category: dto.category,
        video_url: dto.videoUrl,
        body: dto.body,
        is_published: dto.isPublished ?? false,
      })
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);
    this.invalidateRagCache();
    return mapOhs(data);
  }

  async adminUpdate(id: string, dto: UpdateOhsContentDto) {
    const payload: Record<string, unknown> = {};
    if (dto.title !== undefined) payload.title = dto.title;
    if (dto.description !== undefined) payload.description = dto.description;
    if (dto.type !== undefined) payload.type = dto.type;
    if (dto.category !== undefined) payload.category = dto.category;
    if (dto.videoUrl !== undefined) payload.video_url = dto.videoUrl;
    if (dto.body !== undefined) payload.body = dto.body;
    if (dto.isPublished !== undefined) payload.is_published = dto.isPublished;

    const { data, error } = await this.supabase.admin
      .from('ohs_contents')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new NotFoundException('İSG içeriği bulunamadı');
    this.invalidateRagCache();
    return mapOhs(data);
  }

  async adminDelete(id: string) {
    const { error } = await this.supabase.admin.from('ohs_contents').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);
    this.invalidateRagCache();
    return { deleted: true };
  }
}
