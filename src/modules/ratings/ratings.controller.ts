import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { DriverRatingsQueryDto, SubmitRatingDto } from './dto/rating.dto';

@ApiTags('Ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post('submit')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Puan gönder (auth gerekmez)' })
  async submit(@Body() dto: SubmitRatingDto) {
    const data = await this.ratingsService.submitRating(dto);
    return { success: true, data, message: 'Puanınız kaydedildi' };
  }

  @Get('driver/:driverId')
  @ApiOperation({ summary: 'Şoför puan özeti (auth gerekmez)' })
  async driverSummary(@Param('driverId') driverId: string) {
    const data = await this.ratingsService.getDriverSummary(driverId);
    return { success: true, data };
  }

  @Post('token')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'QR puanlama tokenı oluştur' })
  async createToken(@CurrentUser() user: AuthUser) {
    const data = await this.ratingsService.createToken(user);
    return { success: true, data, message: 'Puanlama kodu oluşturuldu' };
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kendi puanlarım ve özet' })
  async listMine(@CurrentUser() user: AuthUser, @Query() query: DriverRatingsQueryDto) {
    const result = await this.ratingsService.listMyRatings(user, query.page, query.limit);
    return { success: true, ...result };
  }
}
