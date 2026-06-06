import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { AdminModuleGuard } from '../../common/guards/admin-module.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireAdminModule } from '../../common/decorators/admin-module.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppointmentsQueryDto, UpdateAppointmentStatusDto } from './dto/appointment.dto';

@ApiTags('Admin - Appointments')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard, AdminModuleGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@RequireAdminModule('appointments')
@Controller('admin/appointments')
export class AdminAppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Tüm randevu/talepler' })
  async list(@Query() query: AppointmentsQueryDto) {
    const result = await this.appointmentsService.adminList(
      query.page,
      query.limit,
      query.type,
      query.status,
    );
    return { success: true, ...result };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Randevu durumu güncelle' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto) {
    const data = await this.appointmentsService.adminUpdateStatus(id, dto);
    return { success: true, data, message: 'Durum güncellendi' };
  }
}
