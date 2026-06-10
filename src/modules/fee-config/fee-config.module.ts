import { Module } from '@nestjs/common';
import { FeeConfigService } from './fee-config.service';
import { FeeConfigController } from './fee-config.controller';
import { AdminFeeConfigController } from './admin-fee-config.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [FeeConfigController, AdminFeeConfigController],
  providers: [FeeConfigService],
  exports: [FeeConfigService],
})
export class FeeConfigModule {}
