import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export const SERVICE_REQUEST_TYPES = [
  'TOW',
  'INSURANCE',
  'COMPLAINT',
  'PIRATE_REPORT',
  'PETITION',
  'ACTIVITY_CERTIFICATE',
] as const;

export type ServiceRequestType = (typeof SERVICE_REQUEST_TYPES)[number];

export class CreateServiceRequestDto {
  @ApiProperty({ enum: SERVICE_REQUEST_TYPES })
  @IsEnum(SERVICE_REQUEST_TYPES)
  type!: ServiceRequestType;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  plateNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  locationAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  locationLat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  locationLng?: number;
}

export class UpdateServiceRequestStatusDto {
  @ApiProperty({ enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED'] })
  @IsEnum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED'])
  status!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNote?: string;
}
