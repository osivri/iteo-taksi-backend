import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteDriverDto {
  @ApiProperty({ description: 'Davet edilecek şoförün profil ID' })
  @IsUUID()
  driverId!: string;
}

export class RequestPlateByVehicleDto {
  @ApiProperty({ description: 'Başvurulacak aracın ID' })
  @IsUUID()
  vehicleId!: string;
}
