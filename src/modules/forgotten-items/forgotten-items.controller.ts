import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ForgottenItemsService } from './forgotten-items.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import {
  CreateForgottenItemDto,
  ForgottenItemsQueryDto,
} from './dto/forgotten-item.dto';

@ApiTags('Forgotten Items')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('forgotten-items')
export class ForgottenItemsController {
  constructor(private readonly forgottenItemsService: ForgottenItemsService) {}

  @Get()
  @ApiOperation({ summary: 'Unutulan eşya bildirimlerim' })
  async list(@CurrentUser() user: AuthUser, @Query() query: ForgottenItemsQueryDto) {
    const result = await this.forgottenItemsService.list(
      user,
      query.page,
      query.limit,
      query.status,
    );
    return { success: true, ...result };
  }

  @Post()
  @ApiOperation({ summary: 'Unutulan eşya bildirimi oluştur' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateForgottenItemDto) {
    const data = await this.forgottenItemsService.create(user, dto);
    return { success: true, data, message: 'Bildiriminiz odaya iletildi' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bildirim detayı' })
  async getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const data = await this.forgottenItemsService.getById(user, id);
    return { success: true, data };
  }
}
