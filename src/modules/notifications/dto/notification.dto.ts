import { IsArray, IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class NotificationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  unreadOnly?: boolean;
}

export class SendNotificationDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  body!: string;

  @ApiProperty({ enum: ['ANNOUNCEMENT', 'NEWS', 'PAYMENT', 'APPOINTMENT', 'SYSTEM'] })
  @IsEnum(['ANNOUNCEMENT', 'NEWS', 'PAYMENT', 'APPOINTMENT', 'SYSTEM'])
  type!: 'ANNOUNCEMENT' | 'NEWS' | 'PAYMENT' | 'APPOINTMENT' | 'SYSTEM';

  @ApiPropertyOptional({ description: 'Boş bırakılırsa tüm kullanıcılara gönderilmez; userId zorunlu değil tek kullanıcı için' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    enum: ['in_app', 'email', 'sms'],
    isArray: true,
    description: 'Ek kanallar (in_app her zaman gönderilir)',
  })
  @IsOptional()
  @IsArray()
  @IsIn(['in_app', 'email', 'sms'], { each: true })
  channels?: ('in_app' | 'email' | 'sms')[];
}