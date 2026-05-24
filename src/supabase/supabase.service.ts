import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private adminClient!: SupabaseClient<Database>;
  private anonClient!: SupabaseClient<Database>;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const url = this.configService.getOrThrow<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.getOrThrow<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    const anonKey = this.configService.getOrThrow<string>('SUPABASE_ANON_KEY');

    this.adminClient = createClient<Database>(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    this.anonClient = createClient<Database>(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    void this.ensureStorageBuckets();
  }

  get admin(): SupabaseClient<Database> {
    return this.adminClient;
  }

  get anon(): SupabaseClient<Database> {
    return this.anonClient;
  }

  createUserClient(accessToken: string): SupabaseClient<Database> {
    const url = this.configService.getOrThrow<string>('SUPABASE_URL');
    const anonKey = this.configService.getOrThrow<string>('SUPABASE_ANON_KEY');

    return createClient<Database>(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  private async ensureStorageBuckets(): Promise<void> {
    const buckets = [
      { id: 'receipts', public: false },
      { id: 'profile-images', public: true },
      { id: 'content-images', public: true },
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
