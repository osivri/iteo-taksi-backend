import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { AdminModuleGuard } from '../../common/guards/admin-module.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireAdminModule } from '../../common/decorators/admin-module.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import {
  CreateExpenseCategoryDto,
  FinanceRecordsQueryDto,
  FinanceSummaryQueryDto,
  UpdateExpenseCategoryDto,
} from './dto/finance.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class ExpenseCategoriesQueryDto {
  @ApiPropertyOptional({ enum: ['INCOME', 'EXPENSE'] })
  @IsOptional()
  @IsEnum(['INCOME', 'EXPENSE'])
  type?: 'INCOME' | 'EXPENSE';
}

@ApiTags('Admin - Finance')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard, AdminModuleGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@RequireAdminModule('finance')
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

  @Get('categories')
  @ApiOperation({ summary: 'Gelir/gider kategorileri' })
  async listCategories(@Query() query: ExpenseCategoriesQueryDto) {
    const data = await this.financeService.adminListExpenseCategories(query.type);
    return { success: true, data };
  }

  @Post('categories')
  @ApiOperation({ summary: 'Gelir/gider kategorisi oluştur' })
  async createCategory(
    @CurrentUser() admin: AuthUser,
    @Body() dto: CreateExpenseCategoryDto,
  ) {
    const data = await this.financeService.adminCreateExpenseCategory(admin.id, dto);
    return { success: true, data, message: 'Kategori oluşturuldu' };
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Gelir/gider kategorisi güncelle' })
  async updateCategory(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseCategoryDto,
  ) {
    const data = await this.financeService.adminUpdateExpenseCategory(admin.id, id, dto);
    return { success: true, data, message: 'Kategori güncellendi' };
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Gelir/gider kategorisi sil' })
  async deleteCategory(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    const data = await this.financeService.adminDeleteExpenseCategory(admin.id, id);
    return { success: true, data, message: 'Kategori silindi' };
  }
}
