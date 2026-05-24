import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { SendNotificationDto } from './dto/notification.dto';
import { getPagination } from '../../common/dto/pagination-query.dto';
import { NotificationChannelsService } from './notification-channels.service';

function mapNotification(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    userId: row.user_id as string | null,
    title: row.title as string,
    body: row.body as string,
    type: row.type as string,
    isRead: row.is_read as boolean,
    createdAt: row.created_at as string,
  };
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly channels: NotificationChannelsService,
  ) {}

  async list(user: AuthUser, page = 1, limit = 20, unreadOnly?: boolean) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);
    const client = this.supabase.createUserClient(user.accessToken);

    let query = client
      .from('notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (unreadOnly) query = query.eq('is_read', false);

    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);

    return {
      items: (data ?? []).map(mapNotification),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async markRead(user: AuthUser, id: string) {
    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new NotFoundException('Bildirim bulunamadı');
    return mapNotification(data);
  }

  async send(dto: SendNotificationDto) {
    const extraChannels = (dto.channels ?? []).filter((c) => c !== 'in_app');
    let result: unknown;
    let userIds: string[] = [];

    if (dto.userId) {
      result = await this.sendToUser(dto.userId, dto.title, dto.body, dto.type);
      userIds = [dto.userId];
    } else {
      result = await this.sendBroadcast(dto.title, dto.body, dto.type);
      const { data: users } = await this.supabase.admin
        .from('profiles')
        .select('id')
        .eq('status', 'ACTIVE');
      userIds = (users ?? []).map((u) => u.id);
    }

    const channelResults =
      extraChannels.length > 0
        ? await this.channels.deliver(userIds, dto.title, dto.body, extraChannels)
        : [];

    return { ...(typeof result === 'object' && result ? result : {}), channelResults };
  }

  private async sendToUser(
    userId: string,
    title: string,
    body: string,
    type: SendNotificationDto['type'],
  ) {
    const { data, error } = await this.supabase.admin
      .from('notifications')
      .insert({ user_id: userId, title, body, type })
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);
    return mapNotification(data);
  }

  async sendBroadcast(title: string, body: string, type: SendNotificationDto['type']) {
    const { data: users, error: usersError } = await this.supabase.admin
      .from('profiles')
      .select('id')
      .eq('status', 'ACTIVE');

    if (usersError) throw new BadRequestException(usersError.message);
    if (!users?.length) throw new BadRequestException('Aktif kullanıcı bulunamadı');

    const rows = users.map((u) => ({
      user_id: u.id,
      title,
      body,
      type,
    }));

    const { data, error } = await this.supabase.admin.from('notifications').insert(rows).select('*');
    if (error) throw new BadRequestException(error.message);

    return { sentCount: data?.length ?? 0 };
  }
}
