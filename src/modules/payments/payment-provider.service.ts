import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

export interface CheckoutSession {
  provider: string;
  providerTransactionId: string;
  checkoutUrl: string;
}

@Injectable()
export class PaymentProviderService {
  constructor(private readonly config: ConfigService) {}

  createCheckout(paymentId: string): CheckoutSession {
    const provider = this.config.get<string>('PAYMENT_PROVIDER', 'mock');
    const providerTxId = `${provider}_${randomUUID()}`;

    if (provider === 'iyzico') {
      const baseUrl = this.config.get('IYZICO_CHECKOUT_URL', 'https://sandbox-api.iyzipay.com');
      return {
        provider: 'iyzico',
        providerTransactionId: providerTxId,
        checkoutUrl: `${baseUrl}/checkout?paymentId=${paymentId}&tx=${providerTxId}`,
      };
    }

    if (provider === 'paytr') {
      const baseUrl = this.config.get('PAYTR_CHECKOUT_URL', 'https://www.paytr.com/odeme/guvenli');
      return {
        provider: 'paytr',
        providerTransactionId: providerTxId,
        checkoutUrl: `${baseUrl}?paymentId=${paymentId}&tx=${providerTxId}`,
      };
    }

    const mockUrl = this.config.get('MOCK_PAYMENT_URL', 'http://localhost:3000/payments/mock');
    return {
      provider: 'mock',
      providerTransactionId: providerTxId,
      checkoutUrl: `${mockUrl}?paymentId=${paymentId}&tx=${providerTxId}`,
    };
  }
}
