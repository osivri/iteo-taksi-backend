import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminUpdateUserDto } from './dto/update-profile.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class AdminUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

@ApiTags('Admin - Users')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Kullanıcı listesi' })
  async list(@Query() query: AdminUsersQueryDto) {
    const data = await this.usersService.listUsers(query.page, query.limit, query.search);
    return { success: true, ...data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Kullanıcı detayı' })
  async getOne(@Param('id') id: string) {
    const data = await this.usersService.getUserById(id);
    return { success: true, data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Kullanıcı güncelle (rol/durum)' })
  async update(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    const data = await this.usersService.adminUpdateUser(id, dto);
    return { success: true, data, message: 'Kullanıcı güncellendi' };
  }
}
