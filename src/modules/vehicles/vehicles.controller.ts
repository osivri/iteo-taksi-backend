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
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { RequestPlateDto } from './dto/plate-request.dto';
import { InviteDriverDto, RequestPlateByVehicleDto } from './dto/invite-driver.dto';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get('marketplace/available-vehicles')
  @ApiOperation({ summary: 'Boşta araçları listele (şoförler için)' })
  async listAvailableVehicles(
    @CurrentUser() user: AuthUser,
    @Query() query: PaginationQueryDto,
  ) {
    const data = await this.vehiclesService.listAvailableVehicles(
      user,
      query.page,
      query.limit,
    );
    return { success: true, data };
  }

  @Get('marketplace/available-drivers')
  @ApiOperation({ summary: 'Boşta şoförleri listele (mal sahipleri için)' })
  async listAvailableDrivers(
    @CurrentUser() user: AuthUser,
    @Query() query: PaginationQueryDto,
  ) {
    const data = await this.vehiclesService.listAvailableDrivers(
      user,
      query.page,
      query.limit,
    );
    return { success: true, data };
  }

  @Get('plate-requests')
  @ApiOperation({ summary: 'Plaka çalışma onay talepleri' })
  async listPlateRequests(
    @CurrentUser() user: AuthUser,
    @Query() query: PaginationQueryDto,
  ) {
    const data = await this.vehiclesService.listPlateRequests(
      user,
      query.page,
      query.limit,
    );
    return { success: true, data };
  }

  @Post('plate-requests')
  @ApiOperation({ summary: 'Şoför plaka çalışma talebi oluştur' })
  async requestPlate(@CurrentUser() user: AuthUser, @Body() dto: RequestPlateDto) {
    const data = await this.vehiclesService.requestPlate(user, dto.plateNumber);
    return { success: true, data, message: 'Onay talebi oda üyesine iletildi' };
  }

  @Post('plate-requests/by-vehicle')
  @ApiOperation({ summary: 'Boş araca şoför başvurusu oluştur' })
  async requestPlateByVehicle(
    @CurrentUser() user: AuthUser,
    @Body() dto: RequestPlateByVehicleDto,
  ) {
    const data = await this.vehiclesService.requestPlateByVehicle(user, dto.vehicleId);
    return { success: true, data, message: 'Başvurunuz oda üyesine iletildi' };
  }

  @Post(':vehicleId/invite-driver')
  @ApiOperation({ summary: 'Araca şoför davet et (mal sahibi)' })
  async inviteDriver(
    @CurrentUser() user: AuthUser,
    @Param('vehicleId') vehicleId: string,
    @Body() dto: InviteDriverDto,
  ) {
    const data = await this.vehiclesService.inviteDriver(user, vehicleId, dto.driverId);
    return { success: true, data, message: 'Davet şoföre iletildi' };
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
  async list(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    const data = await this.vehiclesService.list(user, query.page, query.limit);
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
