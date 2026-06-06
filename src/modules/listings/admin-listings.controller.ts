import { Body, Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import {
  AdminListingsQueryDto,
  UpdateListingStatusDto,
} from './dto/listing.dto';

@ApiTags('Admin - Listings')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/listings')
export class AdminListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  @ApiOperation({ summary: 'Tüm ilanlar' })
  async list(@Query() query: AdminListingsQueryDto) {
    const result = await this.listingsService.adminList(
      query.page,
      query.limit,
      query.type,
      query.status,
      query.district,
      query.neighborhood,
    );
    return { success: true, ...result };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'İlan onayla / reddet' })
  async updateStatus(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateListingStatusDto,
  ) {
    const data = await this.listingsService.adminUpdateStatus(admin, id, dto);
    return { success: true, data, message: 'İlan durumu güncellendi' };
  }
}
