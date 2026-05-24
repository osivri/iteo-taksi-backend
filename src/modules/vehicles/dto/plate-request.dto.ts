import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPlateDto {
  @ApiProperty({ example: '34 ABC 123' })
  @IsString()
  @MaxLength(20)
  plateNumber!: string;
}
