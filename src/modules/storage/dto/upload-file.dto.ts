import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({
    enum: ['receipts', 'profile-images', 'content-images', 'forgotten-items', 'listing-photos'],
  })
  @IsString()
  @IsIn(['receipts', 'profile-images', 'content-images', 'forgotten-items', 'listing-photos'])
  bucket!:
    | 'receipts'
    | 'profile-images'
    | 'content-images'
    | 'forgotten-items'
    | 'listing-photos';

  @ApiPropertyOptional({ description: 'Opsiyonel alt klasör (admin için)' })
  @IsOptional()
  @IsString()
  folder?: string;
}
