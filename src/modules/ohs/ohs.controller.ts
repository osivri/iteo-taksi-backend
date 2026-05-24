import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OhsService } from './ohs.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { OhsQueryDto, OhsChatDto } from './dto/ohs.dto';

@ApiTags('OHS')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('ohs')
export class OhsController {
  constructor(private readonly ohsService: OhsService) {}

  @Get('contents')
  @ApiOperation({ summary: 'İSG içerikleri listesi' })
  async list(@CurrentUser() user: AuthUser, @Query() query: OhsQueryDto) {
    const result = await this.ohsService.listPublic(
      user,
      query.page,
      query.limit,
      query.type,
      query.category,
    );
    return { success: true, ...result };
  }

  @Get('contents/:id')
  @ApiOperation({ summary: 'İSG içerik detayı' })
  async getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const data = await this.ohsService.getPublic(user, id);
    return { success: true, data };
  }

  @Post('chat')
  @ApiOperation({ summary: 'İSG FAQ chatbot (keyword tabanlı MVP)' })
  async chat(@CurrentUser() user: AuthUser, @Body() dto: OhsChatDto) {
    const data = await this.ohsService.chat(user, dto.message);
    return { success: true, data };
  }
}
