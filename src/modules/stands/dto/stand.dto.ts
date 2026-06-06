import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export const STAND_STATUSES = ['ACTIVE', 'PASSIVE'] as const;
export type StandStatus = (typeof STAND_STATUSES)[number];

export class StandsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: STAND_STATUSES })
  @IsOptional()
  @IsEnum(STAND_STATUSES)
  status?: StandStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;
}

export class CreateStandDto {
  @ApiProperty({ example: 'Kadıköy Merkez Durak' })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: 'Kadıköy' })
  @IsString()
  @MaxLength(100)
  district!: string;

  @ApiPropertyOptional({ example: 'Caferağa' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  neighborhood?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  addressLine?: string;

  @ApiPropertyOptional({ enum: STAND_STATUSES, default: 'ACTIVE' })
  @IsOptional()
  @IsEnum(STAND_STATUSES)
  status?: StandStatus;
}

export class UpdateStandDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  neighborhood?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  addressLine?: string;

  @ApiPropertyOptional({ enum: STAND_STATUSES })
  @IsOptional()
  @IsEnum(STAND_STATUSES)
  status?: StandStatus;
}
