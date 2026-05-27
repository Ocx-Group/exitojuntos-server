import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateOrderDto {
  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ example: 5.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  shippingCost?: number;

  @ApiPropertyOptional({ example: 'Por favor entregar en horario de mañana' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'cliente@email.com' })
  @IsEmail()
  shippingEmail!: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @MaxLength(255)
  shippingName!: string;

  @ApiProperty({ example: 'Av. Principal 123' })
  @IsString()
  @MaxLength(500)
  shippingAddress!: string;

  @ApiProperty({ example: 'Bogotá' })
  @IsString()
  @MaxLength(100)
  shippingCity!: string;

  @ApiProperty({ example: 'Cundinamarca' })
  @IsString()
  @MaxLength(100)
  shippingProvince!: string;

  @ApiPropertyOptional({ example: '110111' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  shippingPostalCode?: string;

  @ApiPropertyOptional({ example: '+573001234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  shippingPhone?: string;
}
