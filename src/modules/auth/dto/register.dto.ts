import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'sofor@email.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'secure-password' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ enum: ['USER', 'DRIVER', 'PLATE_OWNER'] })
  @IsOptional()
  @IsEnum(['USER', 'DRIVER', 'PLATE_OWNER'])
  intendedRole?: 'USER' | 'DRIVER' | 'PLATE_OWNER';
}
