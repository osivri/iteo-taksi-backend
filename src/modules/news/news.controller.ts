import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { NewsQueryDto } from './dto/news.dto';

@ApiTags('News')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({ summary: 'Yayındaki haberler' })
  async list(@CurrentUser() user: AuthUser, @Query() query: NewsQueryDto) {
    const result = await this.newsService.listPublic(user, query.page, query.limit, query.category);
    return { success: true, ...result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Haber detayı' })
  async getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const data = await this.newsService.getPublic(user, id);
    return { success: true, data };
  }
}
