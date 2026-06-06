import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { AdminModuleGuard } from '../../common/guards/admin-module.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireAdminModule } from '../../common/decorators/admin-module.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Admin - Audit')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard, AdminModuleGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@RequireAdminModule('audit')
@Controller('admin/audit-logs')
export class AdminAuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'İşlem logları' })
  async list(@Query() query: PaginationQueryDto) {
    const data = await this.auditService.list(query.page, query.limit);
    return { success: true, ...data };
  }
}
