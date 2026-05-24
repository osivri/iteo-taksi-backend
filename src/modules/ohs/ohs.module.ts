import { Module } from '@nestjs/common';
import { OhsService } from './ohs.service';
import { OhsController } from './ohs.controller';
import { AdminOhsController } from './admin-ohs.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [OhsController, AdminOhsController],
  providers: [OhsService],
  exports: [OhsService],
})
export class OhsModule {}
