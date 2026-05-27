import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProductCategoryDto {
  @ApiProperty({ example: 'Suplementos' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: 'Vitaminas y suplementos alimenticios' })
  @IsOptional()
  @IsString()
  description?: string;
}
