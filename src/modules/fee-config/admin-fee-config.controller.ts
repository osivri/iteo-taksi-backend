import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FeeConfigService } from './fee-config.service';
import { UpdateFeeConfigDto } from './dto/fee-config.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin Fees')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/fees')
export class AdminFeeConfigController {
  constructor(private readonly feeConfigService: FeeConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Tarife listesi (admin)' })
  async list() {
    const data = await this.feeConfigService.list();
    return { success: true, data };
  }

  @Patch(':key')
  @ApiOperation({ summary: 'Tarife güncelle' })
  async update(@Param('key') key: string, @Body() dto: UpdateFeeConfigDto) {
    const data = await this.feeConfigService.adminUpdate(key, dto);
    return { success: true, data, message: 'Tarife güncellendi' };
  }
}
