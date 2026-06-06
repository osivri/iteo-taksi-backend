import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RemindersService } from './reminders.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin - Reminders')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/reminders')
export class AdminRemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post('run')
  @ApiOperation({ summary: 'Günlük hatırlatmaları manuel çalıştır' })
  async run() {
    const data = await this.remindersService.runDailyReminders();
    return { success: true, data, message: 'Hatırlatma işi tamamlandı' };
  }
}
