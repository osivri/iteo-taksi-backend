import { Module } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';
import { AdminRatingsController } from './admin-ratings.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [RatingsController, AdminRatingsController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
