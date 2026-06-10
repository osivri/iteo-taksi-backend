import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from '@supabase/supabase-js';
import WebSocket from 'ws';
import type { Database } from './database.types';

const supabaseClientOptions: SupabaseClientOptions<'public'> = {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket },
};

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private adminClient!: SupabaseClient<Database>;
  private anonClient!: SupabaseClient<Database>;
  private serviceRoleConfigured = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const url = this.configService.getOrThrow<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.getOrThrow<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    const anonKey = this.configService.getOrThrow<string>('SUPABASE_ANON_KEY');

    this.serviceRoleConfigured = this.isValidServiceRoleKey(serviceRoleKey);

    if (!this.serviceRoleConfigured) {
      this.logger.warn(
        'SUPABASE_SERVICE_ROLE_KEY yapılandırılmamış. Admin işlemleri (bildirim, marketplace vb.) kısıtlı çalışır. ' +
          'Supabase Dashboard > Settings > API > service_role anahtarını taksi_backend/.env dosyasına ekleyin.',
      );
    }

    this.adminClient = createClient<Database>(
      url,
      serviceRoleKey,
      supabaseClientOptions,
    );

    this.anonClient = createClient<Database>(url, anonKey, supabaseClientOptions);

    if (this.serviceRoleConfigured) {
      void this.ensureStorageBuckets();
    }
  }

  get admin(): SupabaseClient<Database> {
    return this.adminClient;
  }

  get anon(): SupabaseClient<Database> {
    return this.anonClient;
  }

  hasServiceRole(): boolean {
    return this.serviceRoleConfigured;
  }

  private isValidServiceRoleKey(key: string): boolean {
    if (!key || key.includes('your-service-role-key')) return false;
    return key.startsWith('eyJ') || key.startsWith('sb_secret_');
  }

  createUserClient(accessToken: string): SupabaseClient<Database> {
    const url = this.configService.getOrThrow<string>('SUPABASE_URL');
    const anonKey = this.configService.getOrThrow<string>('SUPABASE_ANON_KEY');

    return createClient<Database>(url, anonKey, {
      ...supabaseClientOptions,
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }

  private async ensureStorageBuckets(): Promise<void> {
    const buckets = [
      { id: 'receipts', public: false },
      { id: 'profile-images', public: true },
      { id: 'content-images', public: true },
      { id: 'forgotten-items', public: false },
    ] as const;

    for (const bucket of buckets) {
      const { error } = await this.adminClient.storage.createBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: bucket.id === 'profile-images' ? 2_097_152 : 5_242_880,
      });

      if (error && !error.message.includes('already exists')) {
        this.logger.warn(`Storage bucket "${bucket.id}": ${error.message}`);
      }
    }
  }
}
