import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateAppointmentDto, AppointmentsQueryDto } from './dto/appointment.dto';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Randevu/talep listesi' })
  async list(@CurrentUser() user: AuthUser, @Query() query: AppointmentsQueryDto) {
    const result = await this.appointmentsService.list(
      user,
      query.page,
      query.limit,
      query.type,
      query.status,
    );
    return { success: true, ...result };
  }

  @Post()
  @ApiOperation({ summary: 'Randevu/talep oluştur' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateAppointmentDto) {
    const data = await this.appointmentsService.create(user, dto);
    return { success: true, data, message: 'Talep oluşturuldu' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Randevu detayı' })
  async getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const data = await this.appointmentsService.getById(user, id);
    return { success: true, data };
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Randevuyu iptal et' })
  async cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const data = await this.appointmentsService.cancel(user, id);
    return { success: true, data, message: 'Randevu iptal edildi' };
  }
}
