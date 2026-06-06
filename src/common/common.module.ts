import { Global, Module } from '@nestjs/common';
import { AdminModuleGuard } from './guards/admin-module.guard';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Global()
@Module({
  providers: [SupabaseAuthGuard, RolesGuard, AdminModuleGuard],
  exports: [SupabaseAuthGuard, RolesGuard, AdminModuleGuard],
})
export class CommonModule {}
