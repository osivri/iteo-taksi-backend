import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OhsService } from './ohs.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateOhsContentDto, UpdateOhsContentDto, OhsQueryDto } from './dto/ohs.dto';

@ApiTags('Admin - OHS')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/ohs/contents')
export class AdminOhsController {
  constructor(private readonly ohsService: OhsService) {}

  @Get()
  @ApiOperation({ summary: 'Tüm İSG içerikleri' })
  async list(@Query() query: OhsQueryDto) {
    const result = await this.ohsService.adminList(query.page, query.limit);
    return { success: true, ...result };
  }

  @Post()
  @ApiOperation({ summary: 'İSG içeriği oluştur' })
  async create(@Body() dto: CreateOhsContentDto) {
    const data = await this.ohsService.adminCreate(dto);
    return { success: true, data, message: 'İSG içeriği oluşturuldu' };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'İSG içeriği güncelle' })
  async update(@Param('id') id: string, @Body() dto: UpdateOhsContentDto) {
    const data = await this.ohsService.adminUpdate(id, dto);
    return { success: true, data, message: 'İSG içeriği güncellendi' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'İSG içeriği sil' })
  async remove(@Param('id') id: string) {
    const data = await this.ohsService.adminDelete(id);
    return { success: true, data, message: 'İSG içeriği silindi' };
  }
}
