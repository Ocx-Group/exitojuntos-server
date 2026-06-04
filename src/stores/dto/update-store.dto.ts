import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
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
  // Cadena vacía = limpiar el campo; solo validamos URL si hay valor.
  @ValidateIf(o => o.logoUrl !== '' && o.logoUrl != null)
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://cdn.exitojuntos.com/banner.png' })
  @IsOptional()
  @ValidateIf(o => o.bannerUrl !== '' && o.bannerUrl != null)
  @IsUrl()
  bannerUrl?: string;

  @ApiPropertyOptional({ example: 'https://higo.com/mi-tienda' })
  @IsOptional()
  // Cadena vacía = limpiar el enlace; solo validamos URL si hay valor.
  @ValidateIf(o => o.externalUrl !== '' && o.externalUrl != null)
  @IsUrl({ require_protocol: true })
  externalUrl?: string;

  @ApiPropertyOptional({ example: 'Comprar en Higo' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  externalLabel?: string;

  @ApiPropertyOptional({ example: { primaryColor: '#0a7' } })
  @IsOptional()
  @IsObject()
  theme?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'active', enum: ['active', 'paused'] })
  @IsOptional()
  @IsIn(['active', 'paused'])
  status?: StoreStatus;
}
