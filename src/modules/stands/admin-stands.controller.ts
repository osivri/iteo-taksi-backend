import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StandsService } from './stands.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import {
  CreateStandDto,
  StandsQueryDto,
  UpdateStandDto,
} from './dto/stand.dto';

@ApiTags('Admin - Stands')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/stands')
export class AdminStandsController {
  constructor(private readonly standsService: StandsService) {}

  @Get()
  @ApiOperation({ summary: 'Tüm duraklar' })
  async list(@Query() query: StandsQueryDto) {
    const result = await this.standsService.adminList(
      query.page,
      query.limit,
      query.status,
      query.district,
    );
    return { success: true, ...result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Durak detayı' })
  async getOne(@Param('id') id: string) {
    const data = await this.standsService.adminGetById(id);
    return { success: true, data };
  }

  @Post()
  @ApiOperation({ summary: 'Durak oluştur' })
  async create(@CurrentUser() admin: AuthUser, @Body() dto: CreateStandDto) {
    const data = await this.standsService.adminCreate(admin, dto);
    return { success: true, data, message: 'Durak oluşturuldu' };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Durak güncelle' })
  async update(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateStandDto,
  ) {
    const data = await this.standsService.adminUpdate(admin, id, dto);
    return { success: true, data, message: 'Durak güncellendi' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Durak sil' })
  async remove(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    const data = await this.standsService.adminDelete(admin, id);
    return { success: true, data, message: 'Durak silindi' };
  }
}
