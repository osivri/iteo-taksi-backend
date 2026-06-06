import { Module } from '@nestjs/common';
import { StaffExpensesService } from './staff-expenses.service';
import { StaffExpensesController } from './staff-expenses.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [StaffExpensesController],
  providers: [StaffExpensesService],
  exports: [StaffExpensesService],
})
export class StaffExpensesModule {}
