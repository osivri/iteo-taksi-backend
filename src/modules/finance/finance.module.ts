import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { AdminFinanceController } from './admin-finance.controller';
import { CommonModule } from '../../common/common.module';
import { OcrModule } from '../ocr/ocr.module';

@Module({
  imports: [CommonModule, OcrModule],
  controllers: [FinanceController, AdminFinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
