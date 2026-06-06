import { Body, Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceRequestsService } from './service-requests.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import {
  SERVICE_REQUEST_TYPES,
  UpdateServiceRequestStatusDto,
} from './dto/service-request.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class AdminServiceRequestQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: SERVICE_REQUEST_TYPES })
  @IsOptional()
  @IsEnum(SERVICE_REQUEST_TYPES)
  type?: (typeof SERVICE_REQUEST_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

@ApiTags('Admin - Service Requests')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/service-requests')
export class AdminServiceRequestsController {
  constructor(private readonly service: ServiceRequestsService) {}

  @Get()
  @ApiOperation({ summary: 'Tüm hizmet talepleri' })
  async list(@Query() query: AdminServiceRequestQueryDto) {
    const data = await this.service.adminList(query.page, query.limit, query.type, query.status);
    return { success: true, ...data };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Talep durumu güncelle' })
  async updateStatus(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateServiceRequestStatusDto,
  ) {
    const data = await this.service.adminUpdateStatus(admin, id, dto);
    return { success: true, data, message: 'Talep güncellendi' };
  }
}
