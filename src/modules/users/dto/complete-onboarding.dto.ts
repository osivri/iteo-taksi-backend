import { IsEnum, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteOnboardingDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({ enum: ['USER', 'DRIVER', 'PLATE_OWNER'] })
  @IsEnum(['USER', 'DRIVER', 'PLATE_OWNER'])
  role!: 'USER' | 'DRIVER' | 'PLATE_OWNER';

  @ApiProperty({ example: 'İstanbul' })
  @IsString()
  @MaxLength(100)
  city!: string;

  @ApiProperty({ example: 'Kadıköy' })
  @IsString()
  @MaxLength(100)
  district!: string;

  @ApiProperty({ example: 'Caferağa Mah. Moda Cad. No:12 D:4' })
  @IsString()
  @MaxLength(500)
  addressLine!: string;
}
