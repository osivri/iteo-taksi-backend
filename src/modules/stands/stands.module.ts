import { Module } from '@nestjs/common';
import { StandsService } from './stands.service';
import { StandsController } from './stands.controller';
import { AdminStandsController } from './admin-stands.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [StandsController, AdminStandsController],
  providers: [StandsService],
  exports: [StandsService],
})
export class StandsModule {}
