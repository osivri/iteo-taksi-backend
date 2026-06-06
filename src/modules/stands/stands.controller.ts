import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StandsService } from './stands.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { StandsQueryDto } from './dto/stand.dto';

@ApiTags('Stands')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('stands')
export class StandsController {
  constructor(private readonly standsService: StandsService) {}

  @Get()
  @ApiOperation({ summary: 'Aktif durak listesi' })
  async list(@CurrentUser() user: AuthUser, @Query() query: StandsQueryDto) {
    const result = await this.standsService.list(
      user,
      query.page,
      query.limit,
      query.status,
      query.district,
    );
    return { success: true, ...result };
  }
}
