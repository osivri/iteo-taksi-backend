import { Global, Module } from '@nestjs/common';
import { ProfileCacheService } from '../common/cache/profile-cache.service';
import { SupabaseService } from './supabase.service';

@Global()
@Module({
  providers: [SupabaseService, ProfileCacheService],
  exports: [SupabaseService, ProfileCacheService],
})
export class SupabaseModule {}
