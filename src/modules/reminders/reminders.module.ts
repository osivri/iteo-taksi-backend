import { Module } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { AdminRemindersController } from './admin-reminders.controller';
import { CommonModule } from '../../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [CommonModule, NotificationsModule, PushModule],
  controllers: [AdminRemindersController],
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}
