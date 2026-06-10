import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RemindersService } from './reminders.service';
import { RemindersScheduler } from './reminders.scheduler';
import { AdminRemindersController } from './admin-reminders.controller';
import { CommonModule } from '../../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [ScheduleModule.forRoot(), CommonModule, NotificationsModule, PushModule],
  controllers: [AdminRemindersController],
  providers: [RemindersService, RemindersScheduler],
  exports: [RemindersService],
})
export class RemindersModule {}
