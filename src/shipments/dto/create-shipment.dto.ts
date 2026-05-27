import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateShipmentDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  orderId!: number;

  @ApiPropertyOptional({ example: 'FedEx' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  carrier?: string;

  @ApiPropertyOptional({ example: '1Z999AA10123456784' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  trackingNumber?: string;

  @ApiPropertyOptional({ example: '2025-06-01' })
  @IsOptional()
  @IsString()
  estimatedDelivery?: string;
}
