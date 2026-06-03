import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class FeatureProductDto {
  @ApiProperty({ example: 1, description: 'ID del producto del catálogo' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  productId!: number;

  @ApiPropertyOptional({ example: 0, description: 'Orden de aparición' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({ example: '¡Mi favorito para after del gym!' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  customPitch?: string;
}
