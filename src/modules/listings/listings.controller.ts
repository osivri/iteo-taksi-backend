import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateListingDto, ListingsQueryDto } from './dto/listing.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Listings')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @ApiOperation({ summary: 'İlan oluştur' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateListingDto) {
    const data = await this.listingsService.create(user, dto);
    return { success: true, data, message: 'İlanınız onay için gönderildi' };
  }

  @Get('mine')
  @ApiOperation({ summary: 'Kendi ilanlarım' })
  async listMine(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    const result = await this.listingsService.listMine(user, query.page, query.limit);
    return { success: true, ...result };
  }

  @Get()
  @ApiOperation({ summary: 'Onaylı ilanlar (filtreli)' })
  async listPublic(@CurrentUser() user: AuthUser, @Query() query: ListingsQueryDto) {
    const result = await this.listingsService.listPublic(
      user,
      query.page,
      query.limit,
      query.type,
      query.district,
      query.neighborhood,
    );
    return { success: true, ...result };
  }
}
