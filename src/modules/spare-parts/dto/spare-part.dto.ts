import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export const SPARE_PART_STATUSES = ['ACTIVE', 'PASSIVE'] as const;
export type SparePartStatus = (typeof SPARE_PART_STATUSES)[number];

export const ORDER_STATUSES = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export class CreateSparePartDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  category!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ enum: SPARE_PART_STATUSES, default: 'ACTIVE' })
  @IsOptional()
  @IsEnum(SPARE_PART_STATUSES)
  status?: SparePartStatus;
}

export class UpdateSparePartDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ enum: SPARE_PART_STATUSES })
  @IsOptional()
  @IsEnum(SPARE_PART_STATUSES)
  status?: SparePartStatus;
}

export class SparePartsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;
}

export class CreateSparePartOrderDto {
  @ApiProperty()
  @IsUUID()
  partId!: string;

  @ApiProperty({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class UpdateSparePartOrderDto {
  @ApiPropertyOptional({ enum: ORDER_STATUSES })
  @IsOptional()
  @IsEnum(ORDER_STATUSES)
  status?: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNote?: string;
}

export class AdminOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ORDER_STATUSES })
  @IsOptional()
  @IsEnum(ORDER_STATUSES)
  status?: OrderStatus;
}
