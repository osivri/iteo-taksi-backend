import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { Database } from '../../../supabase/database.types';

type UserRole = Database['public']['Enums']['user_role'];
type UserStatus = Database['public']['Enums']['user_status'];

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(11)
  nationalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  memberNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @ApiPropertyOptional({ example: 'İstanbul' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Kadıköy' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @ApiPropertyOptional({ example: 'Caferağa Mah. Moda Cad. No:12 D:4' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  addressLine?: string;
}

export class AdminUpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ enum: ['USER', 'DRIVER', 'PLATE_OWNER', 'ADMIN', 'SUPER_ADMIN'] })
  @IsOptional()
  @IsEnum(['USER', 'DRIVER', 'PLATE_OWNER', 'ADMIN', 'SUPER_ADMIN'])
  role?: UserRole;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'PASSIVE', 'PENDING_VERIFICATION'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'PASSIVE', 'PENDING_VERIFICATION'])
  status?: UserStatus;
}
