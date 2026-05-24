import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({ enum: ['receipts', 'profile-images', 'content-images'] })
  @IsString()
  @IsIn(['receipts', 'profile-images', 'content-images'])
  bucket!: 'receipts' | 'profile-images' | 'content-images';

  @ApiPropertyOptional({ description: 'Opsiyonel alt klasör (admin için)' })
  @IsOptional()
  @IsString()
  folder?: string;
}
