import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { ShipmentStatus } from '../entities/shipment.entity';

const SHIPMENT_STATUSES: ShipmentStatus[] = [
  'pending',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'failed',
  'returned',
];

export class AddTrackingEventDto {
  @ApiProperty({ enum: SHIPMENT_STATUSES, example: 'in_transit' })
  @IsIn(SHIPMENT_STATUSES)
  status!: ShipmentStatus;

  @ApiPropertyOptional({ example: 'Bogotá, Colombia' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'Paquete llegó al centro de distribución' })
  @IsOptional()
  @IsString()
  description?: string;
}
