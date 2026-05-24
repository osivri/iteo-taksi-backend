import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { StorageModule } from './modules/storage/storage.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { FinanceModule } from './modules/finance/finance.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { NewsModule } from './modules/news/news.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { OhsModule } from './modules/ohs/ohs.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PushModule } from './modules/push/push.module';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    HealthModule,
    StorageModule,
    UsersModule,
    VehiclesModule,
    FinanceModule,
    AnnouncementsModule,
    NewsModule,
    PaymentsModule,
    OhsModule,
    AppointmentsModule,
    NotificationsModule,
    PushModule,
    AdminDashboardModule,
  ],
})
export class AppModule {}
