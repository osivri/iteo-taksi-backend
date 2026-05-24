import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async registerToken(userId: string, token: string, platform: 'ios' | 'android' | 'web') {
    const { error } = await this.supabase.admin.from('push_tokens').upsert(
      {
        user_id: userId,
        token,
        platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' },
    );

    if (error) {
      this.logger.warn(`Push token kaydı başarısız: ${error.message}`);
    }
  }

  async sendToActiveUsers(title: string, body: string, data?: Record<string, string>) {
    const { data: users, error: usersError } = await this.supabase.admin
      .from('profiles')
      .select('id')
      .eq('status', 'ACTIVE');

    if (usersError || !users?.length) {
      return { sent: 0 };
    }

    const userIds = users.map((u) => u.id);
    const { data: rows, error } = await this.supabase.admin
      .from('push_tokens')
      .select('token')
      .in('user_id', userIds);

    if (error) {
      this.logger.warn(`Push token listesi alınamadı: ${error.message}`);
      return { sent: 0 };
    }

    const tokens = (rows ?? []).map((r) => r.token as string).filter(Boolean);
    if (!tokens.length) return { sent: 0 };

    return this.sendExpoPush(tokens.map((to) => ({ to, title, body, data })));
  }

  async sendExpoPush(messages: ExpoPushMessage[]) {
    const chunks: ExpoPushMessage[][] = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    let sent = 0;
    for (const chunk of chunks) {
      try {
        const res = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });
        if (res.ok) sent += chunk.length;
        else this.logger.warn(`Expo push hatası: ${await res.text()}`);
      } catch (e) {
        this.logger.warn(`Expo push isteği başarısız: ${(e as Error).message}`);
      }
    }

    return { sent };
  }
}
