import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { MemberLoginDto } from './dto/member-login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { mapProfile } from '../../common/interfaces/auth-user.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Üye e-posta/şifre girişi' })
  async memberLogin(@Body() dto: MemberLoginDto) {
    const data = await this.authService.memberLogin(dto);
    return { success: true, data, message: 'Giriş başarılı' };
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Üye kayıt' })
  async memberRegister(@Body() dto: RegisterDto) {
    const data = await this.authService.memberRegister(dto);
    return { success: true, data, message: 'Kayıt başarılı' };
  }

  @Post('request-otp')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Telefon OTP iste' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    const data = await this.authService.requestOtp(dto);
    return { success: true, data };
  }

  @Post('verify-otp')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Telefon OTP doğrula' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const data = await this.authService.verifyOtp(dto);
    return { success: true, data, message: 'Giriş başarılı' };
  }

  @Post('admin/login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Admin e-posta/şifre girişi' })
  async adminLogin(@Body() dto: AdminLoginDto) {
    const data = await this.authService.adminLogin(dto);
    return { success: true, data, message: 'Giriş başarılı' };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Access token yenile' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const data = await this.authService.refreshSession(dto.refreshToken);
    return { success: true, data };
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Oturum açmış kullanıcı profili' })
  async me(@CurrentUser() user: AuthUser) {
    return { success: true, data: mapProfile(user.profile, { includeNationalId: true }) };
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Şifre sıfırlama e-postası gönder' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const data = await this.authService.forgotPassword(dto.email);
    return { success: true, data };
  }

  @Post('reset-password')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Yeni şifre belirle (sıfırlama oturumu)' })
  async resetPassword(@CurrentUser() user: AuthUser, @Body() dto: ResetPasswordDto) {
    const data = await this.authService.resetPassword(user.accessToken, dto.password);
    return { success: true, data, message: 'Şifre güncellendi' };
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Oturumu kapat' })
  async logout(@Headers('authorization') authorization?: string) {
    const token = authorization?.replace('Bearer ', '');
    if (!token) {
      return { success: false, message: 'Token gerekli' };
    }
    const data = await this.authService.signOut(token);
    return { success: true, data };
  }
}
