import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { UpdateFeeConfigDto } from './dto/fee-config.dto';

const DEFAULT_FEES: Record<string, { amount: number; currency: string; label: string }> = {
  DUES: { amount: 150, currency: 'TRY', label: 'Oda Aidatı' },
  APP_FEE: { amount: 50, currency: 'TRY', label: 'Uygulama Ücreti' },
  SERVICE_FEE: { amount: 100, currency: 'TRY', label: 'Hizmet Bedeli' },
};

function mapFee(row: Record<string, unknown>) {
  return {
    key: row.key as string,
    amount: Number(row.amount),
    currency: row.currency as string,
    label: row.label as string | null,
    updatedAt: row.updated_at as string,
  };
}

@Injectable()
export class FeeConfigService {
  constructor(private readonly supabase: SupabaseService) {}

  async list() {
    const { data, error } = await this.supabase.admin.from('fee_config').select('*').order('key');

    if (error || !data?.length) {
      return Object.entries(DEFAULT_FEES).map(([key, fee]) => ({
        key,
        amount: fee.amount,
        currency: fee.currency,
        label: fee.label,
        updatedAt: null,
      }));
    }

    return data.map(mapFee);
  }

  async getAmount(key: string): Promise<number> {
    const { data } = await this.supabase.admin
      .from('fee_config')
      .select('amount')
      .eq('key', key)
      .maybeSingle();

    if (data?.amount != null) return Number(data.amount);
    const fallback = DEFAULT_FEES[key];
    if (!fallback) throw new NotFoundException(`Tarife bulunamadı: ${key}`);
    return fallback.amount;
  }

  async adminUpdate(key: string, dto: UpdateFeeConfigDto) {
    const { data, error } = await this.supabase.admin
      .from('fee_config')
      .upsert(
        {
          key,
          amount: dto.amount,
          currency: dto.currency ?? 'TRY',
          label: dto.label,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' },
      )
      .select('*')
      .single();

    if (error || !data) throw new BadRequestException(error?.message ?? 'Tarife güncellenemedi');
    return mapFee(data);
  }
}
