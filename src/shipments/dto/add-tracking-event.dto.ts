import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AddTrackingEventDto {
  @ApiProperty({ example: 'in_transit' })
  @IsString()
  @MaxLength(30)
  status!: string;

  @ApiPropertyOptional({ example: 'Bogotá, Colombia' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ example: 'Paquete llegó al centro de distribución' })
  @IsOptional()
  @IsString()
  description?: string;
}
