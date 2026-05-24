import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUrl, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ScanReceiptDto {
  @ApiProperty()
  @IsString()
  @IsUrl()
  imageUrl!: string;
}

export class CreateFromReceiptDto {
  @ApiProperty()
  @IsString()
  @IsUrl()
  imageUrl!: string;

  @ApiPropertyOptional({ enum: ['INCOME', 'EXPENSE'], default: 'EXPENSE' })
  @IsOptional()
  @IsEnum(['INCOME', 'EXPENSE'])
  type?: 'INCOME' | 'EXPENSE';

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
  @IsString()
  recordDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'OCR sonucunu kayda yaz' })
  @IsOptional()
  @IsBoolean()
  saveOcrData?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vehicleId?: string;
}
