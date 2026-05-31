import { Module } from '@nestjs/common';
import { ForgottenItemsService } from './forgotten-items.service';
import { ForgottenItemsController } from './forgotten-items.controller';
import { AdminForgottenItemsController } from './admin-forgotten-items.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [ForgottenItemsController, AdminForgottenItemsController],
  providers: [ForgottenItemsService],
  exports: [ForgottenItemsService],
})
export class ForgottenItemsModule {}
