import { Module } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequestsController } from './service-requests.controller';
import { AdminServiceRequestsController } from './admin-service-requests.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [ServiceRequestsController, AdminServiceRequestsController],
  providers: [ServiceRequestsService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
