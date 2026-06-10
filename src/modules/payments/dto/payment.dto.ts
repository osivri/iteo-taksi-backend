import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class PaymentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'])
  status?: string;
}

export class CheckoutDto {
  @ApiProperty({ enum: ['DUES', 'APP_FEE', 'SERVICE_FEE', 'OTHER'] })
  @IsEnum(['DUES', 'APP_FEE', 'SERVICE_FEE', 'OTHER'])
  type!: 'DUES' | 'APP_FEE' | 'SERVICE_FEE' | 'OTHER';

  @ApiPropertyOptional({ description: 'Boş bırakılırsa sunucu tarifesinden alınır' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class PaymentWebhookDto {
  @ApiProperty()
  @IsString()
  paymentId!: string;

  @ApiProperty({ enum: ['SUCCESS', 'FAILED', 'CANCELLED'] })
  @IsEnum(['SUCCESS', 'FAILED', 'CANCELLED'])
  status!: 'SUCCESS' | 'FAILED' | 'CANCELLED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  providerTransactionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  webhookSecret?: string;
}
