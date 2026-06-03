import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import type { StoreStatus } from '../entities/store.entity';

export class UpdateStoreDto {
  @ApiPropertyOptional({ example: 'La tienda de Juan' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'Suplementos para tu mejor versión' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  tagline?: string;

  @ApiPropertyOptional({ example: 'https://cdn.exitojuntos.com/logo.png' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://cdn.exitojuntos.com/banner.png' })
  @IsOptional()
  @IsUrl()
  bannerUrl?: string;

  @ApiPropertyOptional({ example: { primaryColor: '#0a7' } })
  @IsOptional()
  @IsObject()
  theme?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'active', enum: ['active', 'paused'] })
  @IsOptional()
  @IsIn(['active', 'paused'])
  status?: StoreStatus;
}
