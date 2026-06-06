import { Module } from '@nestjs/common';
import { SparePartsService } from './spare-parts.service';
import { SparePartsController } from './spare-parts.controller';
import { AdminSparePartsController } from './admin-spare-parts.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [SparePartsController, AdminSparePartsController],
  providers: [SparePartsService],
  exports: [SparePartsService],
})
export class SparePartsModule {}
