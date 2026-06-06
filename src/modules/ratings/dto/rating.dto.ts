import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class SubmitRatingDto {
  @ApiProperty({ description: 'QR token ID' })
  @IsUUID()
  tokenId!: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

export class DriverRatingsQueryDto extends PaginationQueryDto {}
