import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export const LISTING_TYPES = ['VEHICLE_RENTAL', 'PLATE_SALE'] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const LISTING_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export class CreateListingDto {
  @ApiProperty({ enum: LISTING_TYPES })
  @IsEnum(LISTING_TYPES)
  type!: ListingType;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ example: 15000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

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

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;
}

export class ListingsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: LISTING_TYPES })
  @IsOptional()
  @IsEnum(LISTING_TYPES)
  type?: ListingType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  neighborhood?: string;
}

export class AdminListingsQueryDto extends ListingsQueryDto {
  @ApiPropertyOptional({ enum: LISTING_STATUSES })
  @IsOptional()
  @IsEnum(LISTING_STATUSES)
  status?: ListingStatus;
}

export class UpdateListingStatusDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(['APPROVED', 'REJECTED'])
  status!: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNote?: string;
}
