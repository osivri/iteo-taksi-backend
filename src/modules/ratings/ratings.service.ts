import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { getPagination } from '../../common/dto/pagination-query.dto';
import { SubmitRatingDto } from './dto/rating.dto';

function mapToken(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    driverId: row.driver_id as string,
    isActive: row.is_active as boolean,
    expiresAt: row.expires_at as string | null,
    createdAt: row.created_at as string,
  };
}

function mapRating(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    driverId: row.driver_id as string,
    tokenId: row.token_id as string,
    score: row.score as number,
    comment: row.comment as string | null,
    createdAt: row.created_at as string,
  };
}

@Injectable()
export class RatingsService {
  constructor(private readonly supabase: SupabaseService) {}

  async createToken(user: AuthUser) {
    if (user.role !== 'DRIVER') {
      throw new ForbiddenException('Sadece şoförler puanlama QR kodu oluşturabilir');
    }

    const client = this.supabase.createUserClient(user.accessToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await client
      .from('driver_rating_tokens')
      .insert({
        driver_id: user.id,
        is_active: true,
        expires_at: expiresAt.toISOString(),
      })
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);
    return mapToken(data);
  }

  async submitRating(dto: SubmitRatingDto) {
    const { data: token, error: tokenError } = await this.supabase.admin
      .from('driver_rating_tokens')
      .select('*')
      .eq('id', dto.tokenId)
      .single();

    if (tokenError || !token) throw new NotFoundException('Geçersiz puanlama kodu');
    if (!token.is_active) throw new BadRequestException('Bu puanlama kodu artık geçerli değil');

    if (token.expires_at && new Date(token.expires_at as string) < new Date()) {
      throw new BadRequestException('Puanlama kodunun süresi dolmuş');
    }

    const { data: existingRating } = await this.supabase.admin
      .from('driver_ratings')
      .select('id')
      .eq('token_id', dto.tokenId)
      .maybeSingle();

    if (existingRating) {
      throw new BadRequestException('Bu puanlama kodu zaten kullanılmış');
    }

    const { data, error } = await this.supabase.admin
      .from('driver_ratings')
      .insert({
        token_id: dto.tokenId,
        driver_id: token.driver_id,
        score: dto.score,
        comment: dto.comment?.trim() ?? null,
      })
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);

    await this.supabase.admin
      .from('driver_rating_tokens')
      .update({ is_active: false })
      .eq('id', dto.tokenId);

    return mapRating(data);
  }

  async getDriverSummary(driverId: string) {
    const { data, error } = await this.supabase.admin
      .from('driver_ratings')
      .select('score')
      .eq('driver_id', driverId);

    if (error) throw new BadRequestException(error.message);

    const scores = (data ?? []).map((r) => Number(r.score));
    const count = scores.length;
    const average = count
      ? Math.round((scores.reduce((sum, s) => sum + s, 0) / count) * 10) / 10
      : 0;

    return { driverId, average, count };
  }

  async listMyRatings(user: AuthUser, page = 1, limit = 20) {
    if (user.role !== 'DRIVER') {
      throw new ForbiddenException('Sadece şoförler kendi puanlarını görüntüleyebilir');
    }

    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);
    const client = this.supabase.createUserClient(user.accessToken);

    const { data, error, count } = await client
      .from('driver_ratings')
      .select('*', { count: 'exact' })
      .eq('driver_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new BadRequestException(error.message);

    const summary = await this.getDriverSummary(user.id);

    return {
      summary,
      items: (data ?? []).map(mapRating),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async adminList(page = 1, limit = 30) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);
    const { data, error, count } = await this.supabase.admin
      .from('driver_ratings')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new BadRequestException(error.message);
    return {
      items: (data ?? []).map(mapRating),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async adminAnalytics() {
    const { data, error } = await this.supabase.admin
      .from('driver_ratings')
      .select('score, driver_id');

    if (error) throw new BadRequestException(error.message);

    const scores = (data ?? []).map((r) => Number(r.score));
    const totalCount = scores.length;
    const overallAverage = totalCount
      ? Math.round((scores.reduce((sum, s) => sum + s, 0) / totalCount) * 10) / 10
      : 0;

    const byDriver = new Map<string, number[]>();
    for (const row of data ?? []) {
      const driverId = row.driver_id as string;
      const list = byDriver.get(driverId) ?? [];
      list.push(Number(row.score));
      byDriver.set(driverId, list);
    }

    const topDrivers = [...byDriver.entries()]
      .map(([driverId, driverScores]) => ({
        driverId,
        average: Math.round((driverScores.reduce((a, b) => a + b, 0) / driverScores.length) * 10) / 10,
        count: driverScores.length,
      }))
      .sort((a, b) => b.average - a.average || b.count - a.count)
      .slice(0, 10);

    return { overallAverage, totalCount, topDrivers };
  }
}
