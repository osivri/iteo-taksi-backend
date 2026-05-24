import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { RequestPlateDto } from './dto/plate-request.dto';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get('plate-requests')
  @ApiOperation({ summary: 'Plaka çalışma onay talepleri' })
  async listPlateRequests(@CurrentUser() user: AuthUser) {
    const data = await this.vehiclesService.listPlateRequests(user);
    return { success: true, data };
  }

  @Post('plate-requests')
  @ApiOperation({ summary: 'Şoför plaka çalışma talebi oluştur' })
  async requestPlate(@CurrentUser() user: AuthUser, @Body() dto: RequestPlateDto) {
    const data = await this.vehiclesService.requestPlate(user, dto.plateNumber);
    return { success: true, data, message: 'Onay talebi plaka sahibine iletildi' };
  }

  @Patch('plate-requests/:id/approve')
  @ApiOperation({ summary: 'Plaka çalışma talebini onayla' })
  async approvePlateRequest(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const data = await this.vehiclesService.approvePlateRequest(user, id);
    return { success: true, data, message: 'Talep onaylandı' };
  }

  @Patch('plate-requests/:id/reject')
  @ApiOperation({ summary: 'Plaka çalışma talebini reddet' })
  async rejectPlateRequest(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const data = await this.vehiclesService.rejectPlateRequest(user, id);
    return { success: true, data, message: 'Talep reddedildi' };
  }

  @Get()
  @ApiOperation({ summary: 'Araç/plaka listesi' })
  async list(@CurrentUser() user: AuthUser) {
    const data = await this.vehiclesService.list(user);
    return { success: true, data };
  }

  @Post()
  @ApiOperation({ summary: 'Yeni araç ekle' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateVehicleDto) {
    const data = await this.vehiclesService.create(user, dto);
    return { success: true, data, message: 'Araç eklendi' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Araç detayı' })
  async getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const data = await this.vehiclesService.getById(user, id);
    return { success: true, data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Araç güncelle' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    const data = await this.vehiclesService.update(user, id, dto);
    return { success: true, data, message: 'Araç güncellendi' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Araç sil' })
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const data = await this.vehiclesService.remove(user, id);
    return { success: true, data, message: 'Araç silindi' };
  }
}
