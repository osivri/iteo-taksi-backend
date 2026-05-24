import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import {
  CreateFinanceRecordDto,
  UpdateFinanceRecordDto,
  FinanceRecordsQueryDto,
  FinanceSummaryQueryDto,
} from './dto/finance.dto';
import { AttachReceiptDto } from './dto/attach-receipt.dto';
import { ScanReceiptDto, CreateFromReceiptDto } from './dto/scan-receipt.dto';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Gelir/gider özeti' })
  async summary(@CurrentUser() user: AuthUser, @Query() query: FinanceSummaryQueryDto) {
    const data = await this.financeService.getSummary(user, query.from, query.to, query.vehicleId);
    return { success: true, data };
  }

  @Get('records')
  @ApiOperation({ summary: 'Gelir/gider kayıtları' })
  async list(@CurrentUser() user: AuthUser, @Query() query: FinanceRecordsQueryDto) {
    const result = await this.financeService.listRecords(
      user,
      query.page,
      query.limit,
      query.type,
      query.from,
      query.to,
      query.vehicleId,
    );
    return { success: true, ...result };
  }

  @Post('records')
  @ApiOperation({ summary: 'Yeni gelir/gider kaydı' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateFinanceRecordDto) {
    const data = await this.financeService.createRecord(user, dto);
    return { success: true, data, message: 'Kayıt oluşturuldu' };
  }

  @Get('records/:id')
  @ApiOperation({ summary: 'Kayıt detayı' })
  async getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const data = await this.financeService.getRecord(user, id);
    return { success: true, data };
  }

  @Patch('records/:id')
  @ApiOperation({ summary: 'Kayıt güncelle' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateFinanceRecordDto,
  ) {
    const data = await this.financeService.updateRecord(user, id, dto);
    return { success: true, data, message: 'Kayıt güncellendi' };
  }

  @Delete('records/:id')
  @ApiOperation({ summary: 'Kayıt sil' })
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const data = await this.financeService.deleteRecord(user, id);
    return { success: true, data, message: 'Kayıt silindi' };
  }

  @Get('trends')
  @ApiOperation({ summary: 'Günlük gelir/gider trendi' })
  async trends(@CurrentUser() user: AuthUser, @Query() query: FinanceSummaryQueryDto) {
    const data = await this.financeService.getTrends(user, query.from, query.to, query.vehicleId);
    return { success: true, data };
  }

  @Post('receipts/scan')
  @ApiOperation({ summary: 'Fiş görselinden OCR ile okuma' })
  async scanReceipt(@CurrentUser() user: AuthUser, @Body() dto: ScanReceiptDto) {
    const data = await this.financeService.scanReceipt(user, dto.imageUrl);
    return { success: true, data, message: 'Fiş tarandı' };
  }

  @Post('records/from-receipt')
  @ApiOperation({ summary: 'Fiş tarama + kayıt oluşturma' })
  async createFromReceipt(@CurrentUser() user: AuthUser, @Body() dto: CreateFromReceiptDto) {
    const data = await this.financeService.createFromReceipt(user, dto);
    return { success: true, data, message: 'Fişten kayıt oluşturuldu' };
  }

  @Post('records/:id/receipt')
  @ApiOperation({ summary: 'Fiş görseli URL bağla' })
  async attachReceipt(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AttachReceiptDto,
  ) {
    const data = await this.financeService.attachReceipt(
      user,
      id,
      dto.receiptImageUrl,
      dto.runOcr ?? false,
    );
    return { success: true, data, message: dto.runOcr ? 'Fiş eklendi ve tarandı' : 'Fiş görseli eklendi' };
  }
}
