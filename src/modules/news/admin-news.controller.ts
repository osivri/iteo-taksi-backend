import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { AdminModuleGuard } from '../../common/guards/admin-module.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireAdminModule } from '../../common/decorators/admin-module.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateNewsDto, UpdateNewsDto, NewsQueryDto } from './dto/news.dto';

@ApiTags('Admin - News')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard, AdminModuleGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@RequireAdminModule('news')
@Controller('admin/news')
export class AdminNewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({ summary: 'Tüm haberler' })
  async list(@Query() query: NewsQueryDto) {
    const result = await this.newsService.adminList(query.page, query.limit);
    return { success: true, ...result };
  }

  @Post()
  @ApiOperation({ summary: 'Haber oluştur' })
  async create(@Body() dto: CreateNewsDto) {
    const data = await this.newsService.adminCreate(dto);
    return { success: true, data, message: 'Haber oluşturuldu' };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Haber güncelle' })
  async update(@Param('id') id: string, @Body() dto: UpdateNewsDto) {
    const data = await this.newsService.adminUpdate(id, dto);
    return { success: true, data, message: 'Haber güncellendi' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Haber sil' })
  async remove(@Param('id') id: string) {
    const data = await this.newsService.adminDelete(id);
    return { success: true, data, message: 'Haber silindi' };
  }
}
