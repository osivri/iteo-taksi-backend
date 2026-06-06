import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { AdminListingsController } from './admin-listings.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [ListingsController, AdminListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
