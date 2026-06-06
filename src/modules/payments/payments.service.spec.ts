import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';

describe('PaymentsService webhook', () => {
  function buildService(env: Record<string, string>) {
    const config = {
      get: (key: string, fallback?: string) => env[key] ?? fallback,
      getOrThrow: (key: string) => {
        if (!env[key]) throw new Error(`${key} missing`);
        return env[key];
      },
    } as ConfigService;

    const supabase = {
      admin: {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'pay1',
                  status: 'SUCCESS',
                  provider_transaction_id: 'tx1',
                },
                error: null,
              }),
            }),
          }),
        }),
      },
    };

    return new PaymentsService(supabase as never, config);
  }

  it('rejects invalid webhook secret', async () => {
    const service = buildService({
      NODE_ENV: 'development',
      PAYMENT_WEBHOOK_SECRET: 'dev-webhook-secret',
      SUPABASE_URL: 'https://example.supabase.co',
    });

    await expect(
      service.handleWebhook({
        paymentId: 'pay1',
        status: 'SUCCESS',
        webhookSecret: 'wrong',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns idempotent response for already successful payment', async () => {
    const service = buildService({
      NODE_ENV: 'development',
      PAYMENT_WEBHOOK_SECRET: 'dev-webhook-secret',
      SUPABASE_URL: 'https://example.supabase.co',
    });

    const result = await service.handleWebhook({
      paymentId: 'pay1',
      status: 'SUCCESS',
      webhookSecret: 'dev-webhook-secret',
    });

    expect(result.idempotent).toBe(true);
  });

  it('throws when prod uses default webhook secret at startup path', () => {
    const config = {
      get: (key: string) => (key === 'NODE_ENV' ? 'production' : undefined),
    } as ConfigService;

    const service = new PaymentsService({} as never, config);

    expect(() =>
      (service as unknown as { getWebhookSecret: () => string }).getWebhookSecret(),
    ).toThrow('PAYMENT_WEBHOOK_SECRET production ortamında zorunludur');
  });
});
