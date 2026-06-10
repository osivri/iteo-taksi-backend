import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentProviderService } from './payment-provider.service';
import { PaymentsController } from './payments.controller';
import { AdminPaymentsController } from './admin-payments.controller';
import { CommonModule } from '../../common/common.module';
import { FeeConfigModule } from '../fee-config/fee-config.module';

@Module({
  imports: [CommonModule, FeeConfigModule],
  controllers: [PaymentsController, AdminPaymentsController],
  providers: [PaymentsService, PaymentProviderService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
