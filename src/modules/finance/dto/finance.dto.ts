import {
  IsBoolean,
  IsDateString,
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

export class FinanceRecordsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['INCOME', 'EXPENSE'] })
  @IsOptional()
  @IsEnum(['INCOME', 'EXPENSE'])
  type?: 'INCOME' | 'EXPENSE';

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vehicleId?: string;
}

export class CreateFinanceRecordDto {
  @ApiProperty({ enum: ['INCOME', 'EXPENSE'] })
  @IsEnum(['INCOME', 'EXPENSE'])
  type!: 'INCOME' | 'EXPENSE';

  @ApiProperty()
  @IsString()
  category!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty()
  @IsDateString()
  recordDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiptImageUrl?: string;
}

export class UpdateFinanceRecordDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  recordDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiptImageUrl?: string;
}

export class CreateExpenseCategoryDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: ['INCOME', 'EXPENSE'] })
  @IsEnum(['INCOME', 'EXPENSE'])
  type!: 'INCOME' | 'EXPENSE';

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class UpdateExpenseCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ enum: ['INCOME', 'EXPENSE'] })
  @IsOptional()
  @IsEnum(['INCOME', 'EXPENSE'])
  type?: 'INCOME' | 'EXPENSE';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class FinanceSummaryQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vehicleId?: string;
}
