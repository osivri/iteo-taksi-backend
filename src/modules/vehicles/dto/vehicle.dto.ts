import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({ example: '34ABC123' })
  @IsString()
  @MaxLength(20)
  plateNumber!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1980)
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  standId?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  inspectionExpiry?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  insuranceExpiry?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  licenseExpiry?: string;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'PASSIVE'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'PASSIVE'])
  status?: 'ACTIVE' | 'PASSIVE';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  activeDriverId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  standId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  inspectionExpiry?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  insuranceExpiry?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  licenseExpiry?: string | null;
}
