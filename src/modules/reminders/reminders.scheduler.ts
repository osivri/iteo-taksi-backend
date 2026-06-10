import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RemindersService } from './reminders.service';

@Injectable()
export class RemindersScheduler {
  private readonly logger = new Logger(RemindersScheduler.name);

  constructor(private readonly remindersService: RemindersService) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleDailyReminders() {
    try {
      const result = await this.remindersService.runDailyReminders();
      this.logger.log(`Günlük hatırlatmalar tamamlandı: ${JSON.stringify(result)}`);
    } catch (err) {
      this.logger.error('Günlük hatırlatma cron hatası', err);
    }
  }
}
