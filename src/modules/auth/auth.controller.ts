import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { mapProfile } from '../../common/interfaces/auth-user.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-otp')
  @ApiOperation({ summary: 'Supabase telefon OTP iste' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    const data = await this.authService.requestOtp(dto);
    return { success: true, data };
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Supabase OTP doğrula' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const data = await this.authService.verifyOtp(dto);
    return { success: true, data, message: 'Giriş başarılı' };
  }

  @Post('admin/login')
  @ApiOperation({ summary: 'Admin e-posta/şifre girişi (Supabase Auth)' })
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
    return { success: true, data: mapProfile(user.profile) };
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
