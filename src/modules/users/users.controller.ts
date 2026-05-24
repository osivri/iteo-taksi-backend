import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { RegisterPushTokenDto } from './dto/push-token.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Kendi profilini getir' })
  async getMe(@CurrentUser() user: AuthUser) {
    const data = await this.usersService.getMe(user);
    return { success: true, data };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Kendi profilini güncelle' })
  async updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    const data = await this.usersService.updateMe(user, dto);
    return { success: true, data, message: 'Profil güncellendi' };
  }

  @Post('me/onboarding')
  @ApiOperation({ summary: 'İlk kayıt — ad soyad ve rol seçimi' })
  async completeOnboarding(@CurrentUser() user: AuthUser, @Body() dto: CompleteOnboardingDto) {
    const data = await this.usersService.completeOnboarding(user, dto);
    return { success: true, data, message: 'Profiliniz kaydedildi' };
  }

  @Post('me/push-token')
  @ApiOperation({ summary: 'Push bildirim token kaydı' })
  async registerPushToken(@CurrentUser() user: AuthUser, @Body() dto: RegisterPushTokenDto) {
    const data = await this.usersService.registerPushToken(user, dto);
    return { success: true, data, message: 'Push token kaydedildi' };
  }

  @Post('me/kvkk-consent')
  @ApiOperation({ summary: 'KVKK aydınlatma metni onayı' })
  async acceptKvkk(@CurrentUser() user: AuthUser) {
    const data = await this.usersService.acceptKvkk(user);
    return { success: true, data, message: 'KVKK onayı kaydedildi' };
  }
}
