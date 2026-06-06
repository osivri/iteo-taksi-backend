import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import {
  CreateAnnouncementDto,
  TargetRole,
  UpdateAnnouncementDto,
} from './dto/announcement.dto';
import { getPagination } from '../../common/dto/pagination-query.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { PushService } from '../push/push.service';

function mapAnnouncement(row: Record<string, unknown>, isRead?: boolean) {
  return {
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    category: row.category as string,
    priority: row.priority as string,
    coverImageUrl: row.cover_image_url as string | null,
    isPublished: row.is_published as boolean,
    sendPush: row.send_push as boolean,
    targetRoles: (row.target_roles as string[] | null) ?? [],
    isRead: isRead ?? false,
    publishedAt: row.published_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function matchesTargetRole(targetRoles: string[] | null | undefined, role: string) {
  if (!targetRoles?.length) return true;
  return targetRoles.includes(role);
}

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly notificationsService: NotificationsService,
    private readonly pushService: PushService,
  ) {}

  async listPublic(user: AuthUser, page = 1, limit = 20, category?: string) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);
    const client = this.supabase.createUserClient(user.accessToken);

    let query = client
      .from('announcements')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .range(from, to);

    if (category) query = query.eq('category', category);

    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);

    const filtered = (data ?? []).filter((row) =>
      matchesTargetRole(row.target_roles as string[] | null, user.role),
    );

    const ids = filtered.map((row) => row.id as string);
    const readSet = await this.getReadAnnouncementIds(user, ids);

    return {
      items: filtered.map((row) =>
        mapAnnouncement(row, readSet.has(row.id as string)),
      ),
      meta: { page: safePage, limit: safeLimit, total: count ?? filtered.length },
    };
  }

  async getPublic(user: AuthUser, id: string) {
    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('announcements')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (error || !data) throw new NotFoundException('Duyuru bulunamadı');
    if (!matchesTargetRole(data.target_roles as string[] | null, user.role)) {
      throw new NotFoundException('Duyuru bulunamadı');
    }

    const readSet = await this.getReadAnnouncementIds(user, [id]);
    return mapAnnouncement(data, readSet.has(id));
  }

  async markAsRead(user: AuthUser, id: string) {
    const announcement = await this.getPublic(user, id);
    const client = this.supabase.createUserClient(user.accessToken);

    const { error } = await client.from('announcement_reads').upsert(
      {
        announcement_id: id,
        user_id: user.id,
        read_at: new Date().toISOString(),
      },
      { onConflict: 'announcement_id,user_id' },
    );

    if (error) throw new BadRequestException(error.message);
    return { ...announcement, isRead: true };
  }

  async adminList(page = 1, limit = 20) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);

    const { data, error, count } = await this.supabase.admin
      .from('announcements')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new BadRequestException(error.message);

    return {
      items: (data ?? []).map((row) => mapAnnouncement(row)),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async adminCreate(dto: CreateAnnouncementDto) {
    const { data, error } = await this.supabase.admin
      .from('announcements')
      .insert({
        title: dto.title,
        content: dto.content,
        category: dto.category,
        priority: dto.priority ?? 'NORMAL',
        cover_image_url: dto.coverImageUrl,
        is_published: dto.isPublished ?? false,
        send_push: dto.sendPush ?? false,
        target_roles: dto.targetRoles?.length ? dto.targetRoles : null,
        published_at: dto.isPublished ? (dto.publishedAt ?? new Date().toISOString()) : dto.publishedAt,
      })
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);
    const announcement = mapAnnouncement(data);

    if (announcement.isPublished && (dto.sendPush ?? announcement.sendPush)) {
      await this.dispatchAnnouncementNotifications(announcement, dto.targetRoles);
    }

    return announcement;
  }

  async adminUpdate(id: string, dto: UpdateAnnouncementDto) {
    const payload: Record<string, unknown> = {};
    if (dto.title !== undefined) payload.title = dto.title;
    if (dto.content !== undefined) payload.content = dto.content;
    if (dto.category !== undefined) payload.category = dto.category;
    if (dto.priority !== undefined) payload.priority = dto.priority;
    if (dto.coverImageUrl !== undefined) payload.cover_image_url = dto.coverImageUrl;
    if (dto.isPublished !== undefined) {
      payload.is_published = dto.isPublished;
      if (dto.isPublished && !dto.publishedAt) {
        payload.published_at = new Date().toISOString();
      }
    }
    if (dto.sendPush !== undefined) payload.send_push = dto.sendPush;
    if (dto.publishedAt !== undefined) payload.published_at = dto.publishedAt;
    if (dto.targetRoles !== undefined) {
      payload.target_roles = dto.targetRoles.length ? dto.targetRoles : null;
    }

    const { data, error } = await this.supabase.admin
      .from('announcements')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new NotFoundException('Duyuru bulunamadı');
    const announcement = mapAnnouncement(data);

    if (dto.sendPush && announcement.isPublished) {
      await this.dispatchAnnouncementNotifications(
        announcement,
        dto.targetRoles ?? (announcement.targetRoles as TargetRole[]),
      );
    }

    return announcement;
  }

  async adminDelete(id: string) {
    const { error } = await this.supabase.admin.from('announcements').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);
    return { deleted: true };
  }

  private async getReadAnnouncementIds(user: AuthUser, announcementIds: string[]) {
    const readSet = new Set<string>();
    if (!announcementIds.length) return readSet;

    const client = this.supabase.createUserClient(user.accessToken);
    const { data } = await client
      .from('announcement_reads')
      .select('announcement_id')
      .eq('user_id', user.id)
      .in('announcement_id', announcementIds);

    for (const row of data ?? []) {
      readSet.add(row.announcement_id as string);
    }
    return readSet;
  }

  private async dispatchAnnouncementNotifications(
    announcement: ReturnType<typeof mapAnnouncement>,
    targetRoles?: TargetRole[],
  ) {
    const preview = announcement.content.slice(0, 180);
    const roles = targetRoles?.length ? targetRoles : undefined;

    if (roles?.length) {
      const { data: users, error } = await this.supabase.admin
        .from('profiles')
        .select('id')
        .in('role', roles)
        .eq('status', 'ACTIVE');

      if (error) throw new BadRequestException(error.message);
      if (users?.length) {
        await this.supabase.admin.from('notifications').insert(
          users.map((u) => ({
            user_id: u.id,
            title: announcement.title,
            body: preview,
            type: 'ANNOUNCEMENT',
          })),
        );
      }

      await this.pushService.sendToRoles(roles, announcement.title, preview, {
        type: 'ANNOUNCEMENT',
        id: announcement.id,
      });
      return;
    }

    await this.notificationsService.sendBroadcast(announcement.title, preview, 'ANNOUNCEMENT');
    await this.pushService.sendToActiveUsers(announcement.title, preview, {
      type: 'ANNOUNCEMENT',
      id: announcement.id,
    });
  }
}
