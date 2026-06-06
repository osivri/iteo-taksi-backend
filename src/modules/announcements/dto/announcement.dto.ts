import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export const TARGET_ROLES = ['USER', 'DRIVER', 'PLATE_OWNER', 'ADMIN', 'SUPER_ADMIN'] as const;
export type TargetRole = (typeof TARGET_ROLES)[number];

export class AnnouncementsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;
}

export class CreateAnnouncementDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  content!: string;

  @ApiProperty()
  @IsString()
  category!: string;

  @ApiPropertyOptional({ enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] })
  @IsOptional()
  @IsEnum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sendPush?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional({
    enum: TARGET_ROLES,
    isArray: true,
    description: 'Boş bırakılırsa tüm rollere gösterilir',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(TARGET_ROLES, { each: true })
  targetRoles?: TargetRole[];
}

export class UpdateAnnouncementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] })
  @IsOptional()
  @IsEnum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sendPush?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional({ enum: TARGET_ROLES, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(TARGET_ROLES, { each: true })
  targetRoles?: TargetRole[];
}
