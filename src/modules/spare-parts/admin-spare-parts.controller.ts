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
import { SparePartsService } from './spare-parts.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import {
  AdminOrdersQueryDto,
  CreateSparePartDto,
  SparePartsQueryDto,
  UpdateSparePartDto,
  UpdateSparePartOrderDto,
} from './dto/spare-part.dto';

@ApiTags('Admin - Spare Parts')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/spare-parts')
export class AdminSparePartsController {
  constructor(private readonly sparePartsService: SparePartsService) {}

  @Get('orders')
  @ApiOperation({ summary: 'Yedek parça talepleri' })
  async listOrders(@Query() query: AdminOrdersQueryDto) {
    const result = await this.sparePartsService.adminListOrders(
      query.page,
      query.limit,
      query.status,
    );
    return { success: true, ...result };
  }

  @Patch('orders/:id')
  @ApiOperation({ summary: 'Talep durumu güncelle' })
  async updateOrder(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSparePartOrderDto,
  ) {
    const data = await this.sparePartsService.adminUpdateOrder(admin, id, dto);
    return { success: true, data, message: 'Talep güncellendi' };
  }

  @Get()
  @ApiOperation({ summary: 'Yedek parça kataloğu (admin)' })
  async listParts(@Query() query: SparePartsQueryDto) {
    const result = await this.sparePartsService.adminListParts(
      query.page,
      query.limit,
      query.category,
    );
    return { success: true, ...result };
  }

  @Post()
  @ApiOperation({ summary: 'Yedek parça ekle' })
  async createPart(@CurrentUser() admin: AuthUser, @Body() dto: CreateSparePartDto) {
    const data = await this.sparePartsService.adminCreatePart(admin, dto);
    return { success: true, data, message: 'Parça eklendi' };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Yedek parça güncelle' })
  async updatePart(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSparePartDto,
  ) {
    const data = await this.sparePartsService.adminUpdatePart(admin, id, dto);
    return { success: true, data, message: 'Parça güncellendi' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Yedek parça sil' })
  async deletePart(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    const data = await this.sparePartsService.adminDeletePart(admin, id);
    return { success: true, data, message: 'Parça silindi' };
  }
}
