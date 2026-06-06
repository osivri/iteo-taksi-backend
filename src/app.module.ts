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
import { ForgottenItemsModule } from './modules/forgotten-items/forgotten-items.module';
import { AuditModule } from './modules/audit/audit.module';
import { ServiceRequestsModule } from './modules/service-requests/service-requests.module';
import { StandsModule } from './modules/stands/stands.module';
import { ListingsModule } from './modules/listings/listings.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { SparePartsModule } from './modules/spare-parts/spare-parts.module';
import { StaffExpensesModule } from './modules/staff-expenses/staff-expenses.module';
import { RemindersModule } from './modules/reminders/reminders.module';

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
    ForgottenItemsModule,
    AuditModule,
    ServiceRequestsModule,
    StandsModule,
    ListingsModule,
    RatingsModule,
    SparePartsModule,
    StaffExpensesModule,
    RemindersModule,
  ],
})
export class AppModule {}
