import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Proteína Whey 1kg' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 49.99 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  price!: number;

  @ApiPropertyOptional({ example: 'Proteína de suero de leche de alta calidad' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://bucket.s3.amazonaws.com/product.jpg' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  state?: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  offers?: boolean;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  taxPercent?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  valuePoints?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountPercent?: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  productCategoryId!: number;
}
