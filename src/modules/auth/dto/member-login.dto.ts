import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MemberLoginDto {
  @ApiProperty({ example: 'uye@email.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'secure-password' })
  @IsString()
  @MinLength(6)
  password!: string;
}
