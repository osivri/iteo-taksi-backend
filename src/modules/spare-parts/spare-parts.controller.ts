import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SparePartsService } from './spare-parts.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateSparePartOrderDto, SparePartsQueryDto } from './dto/spare-part.dto';

@ApiTags('Spare Parts')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('spare-parts')
export class SparePartsController {
  constructor(private readonly sparePartsService: SparePartsService) {}

  @Get()
  @ApiOperation({ summary: 'Aktif yedek parça kataloğu' })
  async list(@CurrentUser() user: AuthUser, @Query() query: SparePartsQueryDto) {
    const result = await this.sparePartsService.listActive(
      user,
      query.page,
      query.limit,
      query.category,
    );
    return { success: true, ...result };
  }

  @Post('orders')
  @ApiOperation({ summary: 'Yedek parça talebi oluştur' })
  async createOrder(@CurrentUser() user: AuthUser, @Body() dto: CreateSparePartOrderDto) {
    const data = await this.sparePartsService.createOrder(user, dto);
    return { success: true, data, message: 'Talebiniz alındı' };
  }
}
