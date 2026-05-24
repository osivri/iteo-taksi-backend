import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({ example: '5551234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^5\d{9}$/, {
    message: 'Geçerli bir Türkiye cep telefonu numarası girin (5XXXXXXXXX)',
  })
  phone!: string;
}
