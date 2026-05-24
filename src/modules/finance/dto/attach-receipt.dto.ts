import { IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttachReceiptDto {
  @ApiProperty()
  @IsString()
  @IsUrl()
  receiptImageUrl!: string;

  @ApiPropertyOptional({ description: 'Fiş görselinden OCR ile tutar/kategori oku' })
  @IsOptional()
  @IsBoolean()
  runOcr?: boolean;
}
