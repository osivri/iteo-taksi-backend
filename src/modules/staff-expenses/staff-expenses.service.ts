import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { getPagination } from '../../common/dto/pagination-query.dto';
import { AuditService } from '../audit/audit.service';
import { CreateStaffExpenseDto } from './dto/staff-expense.dto';

function mapExpense(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    staffId: row.staff_id as string,
    category: row.category as string,
    amount: Number(row.amount),
    expenseDate: row.expense_date as string,
    description: row.description as string | null,
    receiptUrl: row.receipt_url as string | null,
    staffName: row.staff_name as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

@Injectable()
export class StaffExpensesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async create(user: AuthUser, dto: CreateStaffExpenseDto) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Personel gideri kaydı oluşturma yetkisi gerekli');
    }

    const { data, error } = await this.supabase.admin
      .from('staff_expenses')
      .insert({
        staff_id: user.id,
        category: dto.category.trim(),
        amount: dto.amount,
        expense_date: dto.expenseDate,
        description: dto.description?.trim() ?? null,
        receipt_url: dto.receiptUrl ?? null,
      })
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);
    await this.audit.log(user.id, 'CREATE', 'staff_expense', data.id as string);
    return mapExpense(data);
  }

  async list(user: AuthUser, page = 1, limit = 20, from?: string, to?: string) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Yetkiniz yok');
    }

    const { from: rangeFrom, to: rangeTo, page: safePage, limit: safeLimit } =
      getPagination(page, limit);

    let query = this.supabase.admin
      .from('staff_expenses')
      .select('*', { count: 'exact' })
      .order('expense_date', { ascending: false })
      .range(rangeFrom, rangeTo);

    if (user.role === 'ADMIN') {
      query = query.eq('staff_id', user.id);
    }

    if (from) query = query.gte('expense_date', from);
    if (to) query = query.lte('expense_date', to);

    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);

    const staffIds = [...new Set((data ?? []).map((r) => r.staff_id as string))];
    const { data: profiles } = await this.supabase.admin
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', staffIds.length ? staffIds : ['00000000-0000-0000-0000-000000000000']);

    const nameById = new Map(
      (profiles ?? []).map((p) => [p.id, `${p.first_name} ${p.last_name}`.trim()]),
    );

    return {
      items: (data ?? []).map((row) =>
        mapExpense({ ...row, staff_name: nameById.get(row.staff_id as string) }),
      ),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }
}
