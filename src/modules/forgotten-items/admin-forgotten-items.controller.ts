import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ForgottenItemsService } from './forgotten-items.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { AdminModuleGuard } from '../../common/guards/admin-module.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireAdminModule } from '../../common/decorators/admin-module.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  ForgottenItemsQueryDto,
  UpdateForgottenItemStatusDto,
} from './dto/forgotten-item.dto';

@ApiTags('Admin - Forgotten Items')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard, AdminModuleGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@RequireAdminModule('forgotten-items')
@Controller('admin/forgotten-items')
export class AdminForgottenItemsController {
  constructor(private readonly forgottenItemsService: ForgottenItemsService) {}

  @Get()
  @ApiOperation({ summary: 'Tüm unutulan eşya bildirimleri' })
  async list(@Query() query: ForgottenItemsQueryDto) {
    const result = await this.forgottenItemsService.adminList(
      query.page,
      query.limit,
      query.status,
    );
    return { success: true, ...result };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Bildirim durumunu güncelle' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateForgottenItemStatusDto) {
    const data = await this.forgottenItemsService.adminUpdateStatus(id, dto);
    return { success: true, data, message: 'Durum güncellendi' };
  }
}
