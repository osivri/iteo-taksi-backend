import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class OhsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['VIDEO', 'ARTICLE', 'GUIDE', 'FAQ'] })
  @IsOptional()
  @IsEnum(['VIDEO', 'ARTICLE', 'GUIDE', 'FAQ'])
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;
}

export class CreateOhsContentDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['VIDEO', 'ARTICLE', 'GUIDE', 'FAQ'] })
  @IsEnum(['VIDEO', 'ARTICLE', 'GUIDE', 'FAQ'])
  type!: 'VIDEO' | 'ARTICLE' | 'GUIDE' | 'FAQ';

  @ApiProperty()
  @IsString()
  category!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateOhsContentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['VIDEO', 'ARTICLE', 'GUIDE', 'FAQ'] })
  @IsOptional()
  @IsEnum(['VIDEO', 'ARTICLE', 'GUIDE', 'FAQ'])
  type?: 'VIDEO' | 'ARTICLE' | 'GUIDE' | 'FAQ';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class OhsChatDto {
  @ApiProperty({ example: 'İş kazası durumunda ne yapmalıyım?' })
  @IsString()
  message!: string;
}
