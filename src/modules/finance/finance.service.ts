import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import {
  CreateExpenseCategoryDto,
  CreateFinanceRecordDto,
  UpdateExpenseCategoryDto,
  UpdateFinanceRecordDto,
} from './dto/finance.dto';
import { AuditService } from '../audit/audit.service';
import { CreateFromReceiptDto } from './dto/scan-receipt.dto';
import { getPagination } from '../../common/dto/pagination-query.dto';
import { ReceiptOcrService } from '../ocr/receipt-ocr.service';
import type { ReceiptOcrResult } from '../ocr/receipt-parser.util';

function mapRecord(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    vehicleId: row.vehicle_id as string | null,
    type: row.type as string,
    category: row.category as string,
    amount: Number(row.amount),
    currency: row.currency as string,
    recordDate: row.record_date as string,
    description: row.description as string | null,
    receiptImageUrl: row.receipt_image_url as string | null,
    receiptOcrData: (row.receipt_ocr_data as Record<string, unknown> | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

type AdminFinanceRecord = ReturnType<typeof mapRecord> & {
  plateNumber: string | null;
  memberName: string | null;
};

function mapExpenseCategory(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as string,
    isActive: row.is_active as boolean,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

@Injectable()
export class FinanceService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly receiptOcr: ReceiptOcrService,
    private readonly audit: AuditService,
  ) {}

  async getSummary(user: AuthUser, from?: string, to?: string, vehicleId?: string) {
    const client = this.supabase.createUserClient(user.accessToken);
    let query = client.from('finance_records').select('type, amount');

    if (from) query = query.gte('record_date', from);
    if (to) query = query.lte('record_date', to);
    if (vehicleId) query = query.eq('vehicle_id', vehicleId);

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);

    let totalIncome = 0;
    let totalExpense = 0;

    for (const row of data ?? []) {
      const amount = Number(row.amount);
      if (row.type === 'INCOME') totalIncome += amount;
      else totalExpense += amount;
    }

    return {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      currency: 'TRY',
      from: from ?? null,
      to: to ?? null,
    };
  }

  async listRecords(
    user: AuthUser,
    page = 1,
    limit = 20,
    type?: string,
    from?: string,
    to?: string,
    vehicleId?: string,
  ) {
    const { from: rangeFrom, to: rangeTo, page: safePage, limit: safeLimit } =
      getPagination(page, limit);

    const client = this.supabase.createUserClient(user.accessToken);
    let query = client
      .from('finance_records')
      .select('*', { count: 'exact' })
      .order('record_date', { ascending: false })
      .range(rangeFrom, rangeTo);

    if (type) query = query.eq('type', type);
    if (from) query = query.gte('record_date', from);
    if (to) query = query.lte('record_date', to);
    if (vehicleId) query = query.eq('vehicle_id', vehicleId);

    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);

    return {
      items: (data ?? []).map(mapRecord),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async getRecord(user: AuthUser, id: string) {
    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('finance_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Kayıt bulunamadı');
    return mapRecord(data);
  }

  async createRecord(user: AuthUser, dto: CreateFinanceRecordDto) {
    const vehicleId = await this.resolveVehicleId(user, dto.vehicleId);
    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('finance_records')
      .insert({
        user_id: user.id,
        vehicle_id: vehicleId,
        type: dto.type,
        category: dto.category,
        amount: dto.amount,
        record_date: dto.recordDate,
        description: dto.description,
        receipt_image_url: dto.receiptImageUrl,
      })
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);
    return mapRecord(data);
  }

  async updateRecord(user: AuthUser, id: string, dto: UpdateFinanceRecordDto) {
    const existing = await this.getRecord(user, id);
    if (existing.userId !== user.id && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Bu kaydı güncelleme yetkiniz yok');
    }

    const payload: Record<string, unknown> = {};
    if (dto.category !== undefined) payload.category = dto.category;
    if (dto.amount !== undefined) payload.amount = dto.amount;
    if (dto.recordDate !== undefined) payload.record_date = dto.recordDate;
    if (dto.description !== undefined) payload.description = dto.description;
    if (dto.receiptImageUrl !== undefined) payload.receipt_image_url = dto.receiptImageUrl;

    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('finance_records')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new BadRequestException(error?.message ?? 'Güncellenemedi');
    return mapRecord(data);
  }

  async deleteRecord(user: AuthUser, id: string) {
    const existing = await this.getRecord(user, id);
    if (existing.userId !== user.id && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Bu kaydı silme yetkiniz yok');
    }

    const client = this.supabase.createUserClient(user.accessToken);
    const { error } = await client.from('finance_records').delete().eq('id', id);

    if (error) throw new BadRequestException(error.message);
    return { deleted: true };
  }

  async attachReceipt(
    user: AuthUser,
    id: string,
    receiptImageUrl: string,
    runOcr = false,
  ) {
    const payload: UpdateFinanceRecordDto & { receiptOcrData?: Record<string, unknown> } = {
      receiptImageUrl,
    };

    if (runOcr) {
      const ocr = await this.receiptOcr.scanImage(receiptImageUrl);
      payload.receiptOcrData = ocr as unknown as Record<string, unknown>;
    }

    return this.updateRecordWithExtras(user, id, payload);
  }

  async scanReceipt(_user: AuthUser, imageUrl: string) {
    return this.receiptOcr.scanImage(imageUrl);
  }

  async createFromReceipt(user: AuthUser, dto: CreateFromReceiptDto) {
    const vehicleId = await this.resolveVehicleId(user, dto.vehicleId);
    const ocr = await this.receiptOcr.scanImage(dto.imageUrl);
    const amount = dto.amount ?? ocr.amount;
    if (!amount) {
      throw new BadRequestException('Fişten tutar okunamadı. Lütfen tutarı manuel girin.');
    }

    const category = dto.category ?? ocr.category ?? 'Diğer';
    const recordDate = dto.recordDate ?? ocr.recordDate ?? new Date().toISOString().slice(0, 10);
    const description =
      dto.description ??
      (ocr.merchant ? `OCR: ${ocr.merchant}` : ocr.rawText.slice(0, 120));

    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('finance_records')
      .insert({
        user_id: user.id,
        vehicle_id: vehicleId,
        type: dto.type ?? 'EXPENSE',
        category,
        amount,
        record_date: recordDate,
        description,
        receipt_image_url: dto.imageUrl,
        receipt_ocr_data: dto.saveOcrData !== false ? ocr : null,
      })
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);
    return { record: mapRecord(data), ocr };
  }

  async getTrends(user: AuthUser, from?: string, to?: string, vehicleId?: string) {
    const client = this.supabase.createUserClient(user.accessToken);
    let query = client
      .from('finance_records')
      .select('type, amount, record_date')
      .order('record_date', { ascending: true });

    if (from) query = query.gte('record_date', from);
    if (to) query = query.lte('record_date', to);
    if (vehicleId) query = query.eq('vehicle_id', vehicleId);

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);

    const buckets = new Map<string, { income: number; expense: number }>();
    for (const row of data ?? []) {
      const dateKey = String(row.record_date).slice(0, 10);
      const bucket = buckets.get(dateKey) ?? { income: 0, expense: 0 };
      const amount = Number(row.amount);
      if (row.type === 'INCOME') bucket.income += amount;
      else bucket.expense += amount;
      buckets.set(dateKey, bucket);
    }

    const points = [...buckets.entries()].map(([date, values]) => ({
      date,
      income: values.income,
      expense: values.expense,
      net: values.income - values.expense,
    }));

    return { points, currency: 'TRY' };
  }

  private async resolveVehicleId(
    user: AuthUser,
    vehicleId?: string,
  ): Promise<string | undefined> {
    const requiresPlate = user.role === 'DRIVER' || user.role === 'PLATE_OWNER';
    if (!requiresPlate) return vehicleId;

    if (!vehicleId) {
      throw new BadRequestException('Kayıt oluşturmak için plaka seçmelisiniz');
    }

    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('vehicles')
      .select('id, owner_id, active_driver_id')
      .eq('id', vehicleId)
      .maybeSingle();

    if (error || !data) {
      throw new BadRequestException('Seçilen plaka bulunamadı');
    }

    if (user.role === 'PLATE_OWNER' && data.owner_id !== user.id) {
      throw new ForbiddenException('Bu plakaya erişiminiz yok');
    }

    if (user.role === 'DRIVER' && data.active_driver_id !== user.id) {
      throw new ForbiddenException('Bu plakaya erişiminiz yok');
    }

    return vehicleId;
  }

  private async updateRecordWithExtras(
    user: AuthUser,
    id: string,
    dto: UpdateFinanceRecordDto & { receiptOcrData?: Record<string, unknown> },
  ) {
    const existing = await this.getRecord(user, id);
    if (existing.userId !== user.id && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Bu kaydı güncelleme yetkiniz yok');
    }

    const payload: Record<string, unknown> = {};
    if (dto.category !== undefined) payload.category = dto.category;
    if (dto.amount !== undefined) payload.amount = dto.amount;
    if (dto.recordDate !== undefined) payload.record_date = dto.recordDate;
    if (dto.description !== undefined) payload.description = dto.description;
    if (dto.receiptImageUrl !== undefined) payload.receipt_image_url = dto.receiptImageUrl;
    if (dto.receiptOcrData !== undefined) payload.receipt_ocr_data = dto.receiptOcrData;

    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client
      .from('finance_records')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new BadRequestException(error?.message ?? 'Güncellenemedi');
    return mapRecord(data);
  }

  async adminListRecords(
    page = 1,
    limit = 20,
    type?: string,
    from?: string,
    to?: string,
    vehicleId?: string,
  ) {
    const { from: rangeFrom, to: rangeTo, page: safePage, limit: safeLimit } =
      getPagination(page, limit);

    let query = this.supabase.admin
      .from('finance_records')
      .select('*', { count: 'exact' })
      .order('record_date', { ascending: false })
      .range(rangeFrom, rangeTo);

    if (type) query = query.eq('type', type);
    if (from) query = query.gte('record_date', from);
    if (to) query = query.lte('record_date', to);
    if (vehicleId) query = query.eq('vehicle_id', vehicleId);

    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);

    const items = await this.enrichAdminFinanceRecords(data ?? []);

    return {
      items,
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async adminGetSummary(from?: string, to?: string, vehicleId?: string) {
    let query = this.supabase.admin.from('finance_records').select('type, amount');

    if (from) query = query.gte('record_date', from);
    if (to) query = query.lte('record_date', to);
    if (vehicleId) query = query.eq('vehicle_id', vehicleId);

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);

    let totalIncome = 0;
    let totalExpense = 0;

    for (const row of data ?? []) {
      const amount = Number(row.amount);
      if (row.type === 'INCOME') totalIncome += amount;
      else totalExpense += amount;
    }

    return {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      currency: 'TRY',
      from: from ?? null,
      to: to ?? null,
    };
  }

  async adminExportRecords(from?: string, to?: string, type?: string, vehicleId?: string) {
    let query = this.supabase.admin
      .from('finance_records')
      .select('*')
      .order('record_date', { ascending: false })
      .limit(5000);

    if (from) query = query.gte('record_date', from);
    if (to) query = query.lte('record_date', to);
    if (type) query = query.eq('type', type);
    if (vehicleId) query = query.eq('vehicle_id', vehicleId);

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);

    const enriched = await this.enrichAdminFinanceRecords(data ?? []);

    const header =
      'id,uye,plaka,type,category,amount,currency,record_date,description,receipt_url,ocr_amount';
    const rows = enriched.map((row) => {
      const ocr = row.receiptOcrData as ReceiptOcrResult | null;
      const escape = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      return [
        row.id,
        escape(row.memberName ?? ''),
        escape(row.plateNumber ?? ''),
        row.type,
        escape(String(row.category)),
        row.amount,
        row.currency,
        row.recordDate,
        escape(String(row.description ?? '')),
        escape(String(row.receiptImageUrl ?? '')),
        ocr?.amount ?? '',
      ].join(',');
    });

    return { csv: [header, ...rows].join('\n'), count: rows.length };
  }

  private async enrichAdminFinanceRecords(
    rows: Record<string, unknown>[],
  ): Promise<AdminFinanceRecord[]> {
    const vehicleIds = [
      ...new Set(rows.map((r) => r.vehicle_id).filter(Boolean)),
    ] as string[];
    const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[];

    const plateMap = new Map<string, string>();
    const memberMap = new Map<string, string>();

    if (vehicleIds.length > 0) {
      const { data } = await this.supabase.admin
        .from('vehicles')
        .select('id, plate_number')
        .in('id', vehicleIds);
      for (const v of data ?? []) {
        plateMap.set(v.id as string, v.plate_number as string);
      }
    }

    if (userIds.length > 0) {
      const { data } = await this.supabase.admin
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);
      for (const p of data ?? []) {
        memberMap.set(
          p.id as string,
          `${p.first_name as string} ${p.last_name as string}`.trim(),
        );
      }
    }

    return rows.map((row) => {
      const base = mapRecord(row);
      return {
        ...base,
        plateNumber: base.vehicleId ? plateMap.get(base.vehicleId) ?? null : null,
        memberName: memberMap.get(base.userId) ?? null,
      };
    });
  }

  async listExpenseCategories(type?: 'INCOME' | 'EXPENSE', activeOnly = true) {
    let query = this.supabase.admin
      .from('expense_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (type) query = query.eq('type', type);
    if (activeOnly) query = query.eq('is_active', true);

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return (data ?? []).map(mapExpenseCategory);
  }

  async adminListExpenseCategories(type?: 'INCOME' | 'EXPENSE') {
    let query = this.supabase.admin
      .from('expense_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (type) query = query.eq('type', type);

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return (data ?? []).map(mapExpenseCategory);
  }

  async adminCreateExpenseCategory(adminId: string, dto: CreateExpenseCategoryDto) {
    const { data, error } = await this.supabase.admin
      .from('expense_categories')
      .insert({
        name: dto.name.trim(),
        type: dto.type,
        is_active: dto.isActive ?? true,
        sort_order: dto.sortOrder ?? 0,
      })
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);
    await this.audit.log(adminId, 'CREATE', 'expense_category', data.id as string);
    return mapExpenseCategory(data);
  }

  async adminUpdateExpenseCategory(
    adminId: string,
    id: string,
    dto: UpdateExpenseCategoryDto,
  ) {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (dto.name !== undefined) payload.name = dto.name.trim();
    if (dto.type !== undefined) payload.type = dto.type;
    if (dto.isActive !== undefined) payload.is_active = dto.isActive;
    if (dto.sortOrder !== undefined) payload.sort_order = dto.sortOrder;

    const { data, error } = await this.supabase.admin
      .from('expense_categories')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw new NotFoundException('Kategori bulunamadı');
    await this.audit.log(adminId, 'UPDATE', 'expense_category', id);
    return mapExpenseCategory(data);
  }

  async adminDeleteExpenseCategory(adminId: string, id: string) {
    const { error } = await this.supabase.admin
      .from('expense_categories')
      .delete()
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);
    await this.audit.log(adminId, 'DELETE', 'expense_category', id);
    return { deleted: true };
  }

  async adminGetAnalytics() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthStart = startOfMonth.toISOString().slice(0, 10);

    const [records, ocrRecords, users] = await Promise.all([
      this.supabase.admin.from('finance_records').select('category, type, amount, record_date'),
      this.supabase.admin
        .from('finance_records')
        .select('receipt_ocr_data')
        .not('receipt_ocr_data', 'is', null),
      this.supabase.admin.from('profiles').select('created_at'),
    ]);

    if (records.error) throw new BadRequestException(records.error.message);

    const categoryTotals: Record<string, { income: number; expense: number }> = {};
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    for (const row of records.data ?? []) {
      const cat = String(row.category);
      const bucket = categoryTotals[cat] ?? { income: 0, expense: 0 };
      const amount = Number(row.amount);
      if (row.type === 'INCOME') {
        bucket.income += amount;
        if (String(row.record_date) >= monthStart) monthlyIncome += amount;
      } else {
        bucket.expense += amount;
        if (String(row.record_date) >= monthStart) monthlyExpense += amount;
      }
      categoryTotals[cat] = bucket;
    }

    const topExpenseCategories = Object.entries(categoryTotals)
      .map(([category, v]) => ({ category, total: v.expense }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const weeklySignups: Record<string, number> = {};
    for (const user of users.data ?? []) {
      const week = String(user.created_at).slice(0, 10);
      weeklySignups[week] = (weeklySignups[week] ?? 0) + 1;
    }

    return {
      monthlyFinance: { income: monthlyIncome, expense: monthlyExpense, net: monthlyIncome - monthlyExpense },
      topExpenseCategories,
      ocrScanCount: ocrRecords.data?.length ?? 0,
      weeklySignups: Object.entries(weeklySignups)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-8)
        .map(([date, count]) => ({ date, count })),
      generatedAt: new Date().toISOString(),
    };
  }
}
