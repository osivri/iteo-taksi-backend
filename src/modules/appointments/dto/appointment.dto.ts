import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class AppointmentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['HOTEL', 'AUTO_SERVICE'] })
  @IsOptional()
  @IsEnum(['HOTEL', 'AUTO_SERVICE'])
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'])
  status?: string;
}

export class CreateAppointmentDto {
  @ApiProperty({ enum: ['HOTEL', 'AUTO_SERVICE'] })
  @IsEnum(['HOTEL', 'AUTO_SERVICE'])
  type!: 'HOTEL' | 'AUTO_SERVICE';

  @ApiProperty()
  @IsDateString()
  requestedDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requestedTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  checkInDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  checkOutDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guestCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roomType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plateNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serviceType?: string;
}

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'] })
  @IsEnum(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'])
  status!: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminNote?: string;
}
