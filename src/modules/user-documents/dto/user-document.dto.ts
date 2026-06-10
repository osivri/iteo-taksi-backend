import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateUserDocumentDto {
  @ApiProperty({ enum: ['DRIVERS_LICENSE', 'VEHICLE_REGISTRATION', 'SRC_CERTIFICATE', 'OTHER'] })
  @IsEnum(['DRIVERS_LICENSE', 'VEHICLE_REGISTRATION', 'SRC_CERTIFICATE', 'OTHER'])
  type!: 'DRIVERS_LICENSE' | 'VEHICLE_REGISTRATION' | 'SRC_CERTIFICATE' | 'OTHER';

  @ApiProperty()
  @IsString()
  fileUrl!: string;
}

export class ReviewUserDocumentDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(['APPROVED', 'REJECTED'])
  status!: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminNote?: string;
}
