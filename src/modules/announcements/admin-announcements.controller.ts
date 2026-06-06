import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { AdminModuleGuard } from '../../common/guards/admin-module.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireAdminModule } from '../../common/decorators/admin-module.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  AnnouncementsQueryDto,
} from './dto/announcement.dto';

@ApiTags('Admin - Announcements')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard, AdminModuleGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@RequireAdminModule('announcements')
@Controller('admin/announcements')
export class AdminAnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @ApiOperation({ summary: 'Tüm duyurular (admin)' })
  async list(@Query() query: AnnouncementsQueryDto) {
    const result = await this.announcementsService.adminList(query.page, query.limit);
    return { success: true, ...result };
  }

  @Post()
  @ApiOperation({ summary: 'Duyuru oluştur' })
  async create(@Body() dto: CreateAnnouncementDto) {
    const data = await this.announcementsService.adminCreate(dto);
    return { success: true, data, message: 'Duyuru oluşturuldu' };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Duyuru güncelle' })
  async update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    const data = await this.announcementsService.adminUpdate(id, dto);
    return { success: true, data, message: 'Duyuru güncellendi' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Duyuru sil' })
  async remove(@Param('id') id: string) {
    const data = await this.announcementsService.adminDelete(id);
    return { success: true, data, message: 'Duyuru silindi' };
  }
}
