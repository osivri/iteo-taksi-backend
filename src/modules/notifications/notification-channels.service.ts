import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service';

export type NotificationChannel = 'in_app' | 'email' | 'sms';

export interface ChannelDeliveryResult {
  channel: NotificationChannel;
  success: boolean;
  detail?: string;
}

@Injectable()
export class NotificationChannelsService {
  private readonly logger = new Logger(NotificationChannelsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
  ) {}

  async deliver(
    userIds: string[],
    title: string,
    body: string,
    channels: NotificationChannel[],
  ): Promise<ChannelDeliveryResult[]> {
    const results: ChannelDeliveryResult[] = [];

    if (channels.includes('email')) {
      results.push(await this.sendEmailBatch(userIds, title, body));
    }
    if (channels.includes('sms')) {
      results.push(await this.sendSmsBatch(userIds, title, body));
    }

    return results;
  }

  private async sendEmailBatch(userIds: string[], title: string, body: string): Promise<ChannelDeliveryResult> {
    const provider = this.config.get<string>('EMAIL_PROVIDER', 'mock');
    const { data: profiles } = await this.supabase.admin
      .from('profiles')
      .select('id, email')
      .in('id', userIds);

    const emails = (profiles ?? []).map((p) => p.email).filter(Boolean);
    if (provider === 'mock') {
      this.logger.log(`[MOCK EMAIL] ${emails.length} alıcı — "${title}"`);
      return { channel: 'email', success: true, detail: `${emails.length} e-posta gönderildi` };
    }

    return { channel: 'email', success: false, detail: 'E-posta sağlayıcısı yapılandırılmamış' };
  }

  private async sendSmsBatch(userIds: string[], title: string, body: string): Promise<ChannelDeliveryResult> {
    const provider = this.config.get<string>('SMS_PROVIDER', 'mock');
    const { data: profiles } = await this.supabase.admin
      .from('profiles')
      .select('id, phone')
      .in('id', userIds);

    const phones = (profiles ?? []).map((p) => p.phone).filter(Boolean);
    const message = `${title}: ${body}`.slice(0, 160);

    if (provider === 'mock') {
      this.logger.log(`[MOCK SMS] ${phones.length} alıcı`);
      return { channel: 'sms', success: true, detail: `${phones.length} SMS gönderildi` };
    }

    return { channel: 'sms', success: false, detail: 'SMS sağlayıcısı yapılandırılmamış' };
  }
}
