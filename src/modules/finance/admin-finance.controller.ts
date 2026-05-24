import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FinanceRecordsQueryDto, FinanceSummaryQueryDto } from './dto/finance.dto';

@ApiTags('Admin - Finance')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/finance')
export class AdminFinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Tüm üyelerin gelir/gider özeti' })
  async summary(@Query() query: FinanceSummaryQueryDto) {
    const data = await this.financeService.adminGetSummary(query.from, query.to, query.vehicleId);
    return { success: true, data };
  }

  @Get('records')
  @ApiOperation({ summary: 'Tüm gelir/gider kayıtları' })
  async list(@Query() query: FinanceRecordsQueryDto) {
    const result = await this.financeService.adminListRecords(
      query.page,
      query.limit,
      query.type,
      query.from,
      query.to,
      query.vehicleId,
    );
    return { success: true, ...result };
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Muhasebe analitik özeti' })
  async analytics() {
    const data = await this.financeService.adminGetAnalytics();
    return { success: true, data };
  }

  @Get('export')
  @ApiOperation({ summary: 'Muhasebe kayıtlarını CSV olarak dışa aktar' })
  async export(
    @Query() query: FinanceRecordsQueryDto,
    @Res() res: Response,
  ) {
    const { csv } = await this.financeService.adminExportRecords(
      query.from,
      query.to,
      query.type,
      query.vehicleId,
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="iteo-finance-export.csv"');
    res.send(`\uFEFF${csv}`);
  }
}
