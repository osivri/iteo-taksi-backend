import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly supabase: SupabaseService) {}

  async getStats() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthStart = startOfMonth.toISOString();

    const [
      users,
      vehicles,
      pendingAppointments,
      paymentsThisMonth,
      publishedAnnouncements,
      publishedNews,
    ] = await Promise.all([
      this.supabase.admin.from('profiles').select('*', { count: 'exact', head: true }),
      this.supabase.admin.from('vehicles').select('*', { count: 'exact', head: true }),
      this.supabase.admin
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING'),
      this.supabase.admin
        .from('payments')
        .select('amount')
        .eq('status', 'SUCCESS')
        .gte('paid_at', monthStart),
      this.supabase.admin
        .from('announcements')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true),
      this.supabase.admin
        .from('news')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true),
    ]);

    if (users.error || vehicles.error || pendingAppointments.error) {
      throw new BadRequestException('Dashboard verileri alınamadı');
    }

    const monthlyRevenue = (paymentsThisMonth.data ?? []).reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    return {
      totalUsers: users.count ?? 0,
      totalVehicles: vehicles.count ?? 0,
      pendingAppointments: pendingAppointments.count ?? 0,
      monthlyRevenue,
      currency: 'TRY',
      publishedAnnouncements: publishedAnnouncements.count ?? 0,
      publishedNews: publishedNews.count ?? 0,
      generatedAt: new Date().toISOString(),
    };
  }

  async getReports() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthStart = startOfMonth.toISOString();

    const [
      usersByRole,
      usersByStatus,
      appointmentsByType,
      appointmentsByStatus,
      paymentsThisMonth,
      pendingUsers,
      financeThisMonth,
    ] = await Promise.all([
      this.supabase.admin.from('profiles').select('role'),
      this.supabase.admin.from('profiles').select('status'),
      this.supabase.admin.from('appointments').select('type'),
      this.supabase.admin.from('appointments').select('status'),
      this.supabase.admin
        .from('payments')
        .select('amount, status')
        .gte('created_at', monthStart),
      this.supabase.admin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING_VERIFICATION'),
      this.supabase.admin
        .from('finance_records')
        .select('type, amount')
        .gte('record_date', monthStart),
    ]);

    const countBy = <T extends string>(rows: { [k: string]: T }[] | null, key: string) => {
      const map: Record<string, number> = {};
      for (const row of rows ?? []) {
        const val = String(row[key]);
        map[val] = (map[val] ?? 0) + 1;
      }
      return map;
    };

    const monthlyPayments = paymentsThisMonth.data ?? [];
    const successPayments = monthlyPayments.filter((p) => p.status === 'SUCCESS');
    const failedPayments = monthlyPayments.filter((p) => p.status === 'FAILED');

    const financeRows = financeThisMonth.data ?? [];
    const monthlyIncome = financeRows
      .filter((r) => r.type === 'INCOME')
      .reduce((s, r) => s + Number(r.amount), 0);
    const monthlyExpense = financeRows
      .filter((r) => r.type === 'EXPENSE')
      .reduce((s, r) => s + Number(r.amount), 0);

    return {
      usersByRole: countBy(usersByRole.data as { role: string }[] | null, 'role'),
      usersByStatus: countBy(usersByStatus.data as { status: string }[] | null, 'status'),
      appointmentsByType: countBy(appointmentsByType.data as { type: string }[] | null, 'type'),
      appointmentsByStatus: countBy(appointmentsByStatus.data as { status: string }[] | null, 'status'),
      paymentsThisMonth: {
        total: monthlyPayments.length,
        success: successPayments.length,
        failed: failedPayments.length,
        revenue: successPayments.reduce((s, p) => s + Number(p.amount), 0),
        currency: 'TRY',
      },
      financeThisMonth: {
        income: monthlyIncome,
        expense: monthlyExpense,
        net: monthlyIncome - monthlyExpense,
        currency: 'TRY',
      },
      pendingVerifications: pendingUsers.count ?? 0,
      generatedAt: new Date().toISOString(),
    };
  }
}
