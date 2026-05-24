import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { NotificationsQueryDto } from './dto/notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Bildirim listesi' })
  async list(@CurrentUser() user: AuthUser, @Query() query: NotificationsQueryDto) {
    const unreadOnly = query.unreadOnly === true || String(query.unreadOnly) === 'true';
    const result = await this.notificationsService.list(
      user,
      query.page,
      query.limit,
      unreadOnly,
    );
    return { success: true, ...result };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Bildirimi okundu işaretle' })
  async markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const data = await this.notificationsService.markRead(user, id);
    return { success: true, data };
  }
}
