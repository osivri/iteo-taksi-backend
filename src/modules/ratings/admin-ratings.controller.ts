import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Admin Ratings')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/ratings')
export class AdminRatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Get('analytics')
  @ApiOperation({ summary: 'Puanlama analitiği' })
  async analytics() {
    const data = await this.ratingsService.adminAnalytics();
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'Tüm puanlar' })
  async list(@Query() query: PaginationQueryDto) {
    const result = await this.ratingsService.adminList(query.page, query.limit);
    return { success: true, ...result };
  }
}
