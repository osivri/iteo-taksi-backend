import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceRequestsService } from './service-requests.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import {
  CreateServiceRequestDto,
  SERVICE_REQUEST_TYPES,
} from './dto/service-request.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class ServiceRequestQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: SERVICE_REQUEST_TYPES })
  @IsOptional()
  @IsEnum(SERVICE_REQUEST_TYPES)
  type?: (typeof SERVICE_REQUEST_TYPES)[number];
}

@ApiTags('Service Requests')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private readonly service: ServiceRequestsService) {}

  @Get()
  @ApiOperation({ summary: 'Kendi hizmet taleplerim' })
  async list(@CurrentUser() user: AuthUser, @Query() query: ServiceRequestQueryDto) {
    const data = await this.service.listMine(user, query.page, query.limit, query.type);
    return { success: true, ...data };
  }

  @Post()
  @ApiOperation({ summary: 'Hizmet talebi oluştur (çekici, sigorta, şikayet vb.)' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateServiceRequestDto) {
    const data = await this.service.create(user, dto);
    return { success: true, data, message: 'Talebiniz alındı' };
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Talebi iptal et' })
  async cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const data = await this.service.cancel(user, id);
    return { success: true, data };
  }
}
