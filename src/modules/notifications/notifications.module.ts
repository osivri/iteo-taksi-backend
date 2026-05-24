import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { AdminNotificationsController } from './admin-notifications.controller';
import { NotificationChannelsService } from './notification-channels.service';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [NotificationsController, AdminNotificationsController],
  providers: [NotificationsService, NotificationChannelsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
