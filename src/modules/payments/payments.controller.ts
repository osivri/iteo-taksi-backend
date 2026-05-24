import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CheckoutDto, PaymentsQueryDto, PaymentWebhookDto } from './dto/payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ödeme geçmişi' })
  async list(@CurrentUser() user: AuthUser, @Query() query: PaymentsQueryDto) {
    const result = await this.paymentsService.list(user, query.page, query.limit, query.status);
    return { success: true, ...result };
  }

  @Get(':id')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ödeme detayı' })
  async getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const data = await this.paymentsService.getById(user, id);
    return { success: true, data };
  }

  @Post('checkout')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mock ödeme başlat' })
  async checkout(@CurrentUser() user: AuthUser, @Body() dto: CheckoutDto) {
    const data = await this.paymentsService.checkout(user, dto);
    return { success: true, data, message: 'Ödeme oturumu oluşturuldu' };
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Ödeme webhook (mock sağlayıcı)' })
  async webhook(@Body() dto: PaymentWebhookDto) {
    const data = await this.paymentsService.handleWebhook(dto);
    return { success: true, data };
  }
}
