import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CreateForgottenItemDto {
  @ApiProperty({ description: 'İlgili plaka / araç ID' })
  @IsUUID()
  vehicleId!: string;

  @ApiProperty({ example: 'Yolcu cüzdanı, siyah deri' })
  @IsString()
  @MaxLength(1000)
  description!: string;

  @ApiProperty({ description: 'Storage upload sonrası dönen path' })
  @IsString()
  @MaxLength(500)
  photoPath!: string;
}

export class ForgottenItemsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'REVIEWING', 'RETURNED', 'CLOSED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'REVIEWING', 'RETURNED', 'CLOSED'])
  status?: 'PENDING' | 'REVIEWING' | 'RETURNED' | 'CLOSED';
}

export class UpdateForgottenItemStatusDto {
  @ApiProperty({ enum: ['PENDING', 'REVIEWING', 'RETURNED', 'CLOSED'] })
  @IsEnum(['PENDING', 'REVIEWING', 'RETURNED', 'CLOSED'])
  status!: 'PENDING' | 'REVIEWING' | 'RETURNED' | 'CLOSED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNote?: string;
}
