import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FeeConfigService } from './fee-config.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@ApiTags('Fees')
@Controller('fees')
export class FeeConfigController {
  constructor(private readonly feeConfigService: FeeConfigService) {}

  @Get()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aktif tarife listesi' })
  async list() {
    const data = await this.feeConfigService.list();
    return { success: true, data };
  }
}
