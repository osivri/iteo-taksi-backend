import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StaffExpensesService } from './staff-expenses.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { AdminModuleGuard } from '../../common/guards/admin-module.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireAdminModule } from '../../common/decorators/admin-module.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateStaffExpenseDto, StaffExpensesQueryDto } from './dto/staff-expense.dto';

@ApiTags('Staff Expenses')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard, AdminModuleGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@RequireAdminModule('staff-expenses')
@Controller('staff-expenses')
export class StaffExpensesController {
  constructor(private readonly staffExpensesService: StaffExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Personel gideri kaydet' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateStaffExpenseDto) {
    const data = await this.staffExpensesService.create(user, dto);
    return { success: true, data, message: 'Gider kaydedildi' };
  }

  @Get()
  @ApiOperation({ summary: 'Gider listesi (admin: tümü, personel: kendi)' })
  async list(@CurrentUser() user: AuthUser, @Query() query: StaffExpensesQueryDto) {
    const result = await this.staffExpensesService.list(
      user,
      query.page,
      query.limit,
      query.from,
      query.to,
    );
    return { success: true, ...result };
  }
}
