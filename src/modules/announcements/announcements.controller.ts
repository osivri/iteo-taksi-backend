import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AnnouncementsQueryDto } from './dto/announcement.dto';

@ApiTags('Announcements')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @ApiOperation({ summary: 'Yayındaki duyurular' })
  async list(@CurrentUser() user: AuthUser, @Query() query: AnnouncementsQueryDto) {
    const result = await this.announcementsService.listPublic(
      user,
      query.page,
      query.limit,
      query.category,
    );
    return { success: true, ...result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Duyuru detayı' })
  async getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const data = await this.announcementsService.getPublic(user, id);
    return { success: true, data };
  }
}
