import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CheckoutDto, PaymentWebhookDto } from './dto/payment.dto';
import { getPagination } from '../../common/dto/pagination-query.dto';
import { FeeConfigService } from '../fee-config/fee-config.service';
import { PaymentProviderService } from './payment-provider.service';

function mapPayment(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as string,
    amount: Number(row.amount),
    currency: row.currency as string,
    status: row.status as string,
    provider: row.provider as string,
    providerTransactionId: row.provider_transaction_id as string | null,
    receiptUrl: row.receipt_url as string | null,
    paidAt: row.paid_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly configService: ConfigService,
    private readonly feeConfig: FeeConfigService,
    private readonly paymentProvider: PaymentProviderService,
  ) {}

  async list(user: AuthUser, page = 1, limit = 20, status?: string) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);
    const client = this.supabase.createUserClient(user.accessToken);

    let query = client
      .from('payments')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);

    return {
      items: (data ?? []).map(mapPayment),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }

  async getById(user: AuthUser, id: string) {
    const client = this.supabase.createUserClient(user.accessToken);
    const { data, error } = await client.from('payments').select('*').eq('id', id).single();

    if (error || !data) throw new NotFoundException('Ödeme bulunamadı');
    return mapPayment(data);
  }

  async checkout(user: AuthUser, dto: CheckoutDto) {
    const amount =
      dto.amount ??
      (dto.type !== 'OTHER' ? await this.feeConfig.getAmount(dto.type) : null);

    if (!amount) {
      throw new BadRequestException('OTHER tipi ödemeler için tutar zorunludur');
    }

    const client = this.supabase.createUserClient(user.accessToken);

    const { data, error } = await client
      .from('payments')
      .insert({
        user_id: user.id,
        type: dto.type,
        amount,
        status: 'PENDING',
        provider: 'pending',
      })
      .select('*')
      .single();

    if (error) throw new BadRequestException(error.message);

    const payment = mapPayment(data);
    const checkout = this.paymentProvider.createCheckout(payment.id);

    const { data: updated, error: updateError } = await this.supabase.admin
      .from('payments')
      .update({
        provider: checkout.provider,
        provider_transaction_id: checkout.providerTransactionId,
      })
      .eq('id', payment.id)
      .select('*')
      .single();

    if (updateError || !updated) throw new BadRequestException(updateError?.message ?? 'Ödeme güncellenemedi');

    return {
      payment: mapPayment(updated),
      checkoutUrl: checkout.checkoutUrl,
      providerTransactionId: checkout.providerTransactionId,
    };
  }

  private getWebhookSecret(): string {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    const secret = this.configService.get<string>('PAYMENT_WEBHOOK_SECRET');

    if (!secret || secret === 'dev-webhook-secret') {
      if (isProd) {
        throw new Error('PAYMENT_WEBHOOK_SECRET production ortamında zorunludur');
      }
      return 'dev-webhook-secret';
    }

    return secret;
  }

  async handleWebhook(dto: PaymentWebhookDto) {
    const secret = this.getWebhookSecret();
    if (dto.webhookSecret !== secret) {
      throw new UnauthorizedException('Geçersiz webhook imzası');
    }

    const { data: existing, error: findError } = await this.supabase.admin
      .from('payments')
      .select('*')
      .eq('id', dto.paymentId)
      .single();

    if (findError || !existing) throw new NotFoundException('Ödeme bulunamadı');

    if (existing.status === 'SUCCESS') {
      return { payment: mapPayment(existing), idempotent: true };
    }

    const payload: Record<string, unknown> = {
      status: dto.status,
      provider_transaction_id: dto.providerTransactionId ?? existing.provider_transaction_id,
    };

    if (dto.status === 'SUCCESS') {
      const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL').replace(/\/$/, '');
      payload.paid_at = new Date().toISOString();
      payload.receipt_url = `${supabaseUrl}/storage/v1/object/public/content-images/receipts/${dto.paymentId}.pdf`;
    }

    const { data, error } = await this.supabase.admin
      .from('payments')
      .update(payload)
      .eq('id', dto.paymentId)
      .select('*')
      .single();

    if (error || !data) throw new BadRequestException(error?.message ?? 'Webhook işlenemedi');
    return { payment: mapPayment(data), idempotent: false };
  }

  async adminList(page = 1, limit = 20, status?: string) {
    const { from, to, page: safePage, limit: safeLimit } = getPagination(page, limit);

    let query = this.supabase.admin
      .from('payments')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw new BadRequestException(error.message);

    return {
      items: (data ?? []).map(mapPayment),
      meta: { page: safePage, limit: safeLimit, total: count ?? 0 },
    };
  }
}
