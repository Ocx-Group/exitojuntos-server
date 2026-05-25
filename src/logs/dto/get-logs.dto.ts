import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum LogLevel {
  LOG = 'LOG',
  ERROR = 'ERROR',
  WARN = 'WARN',
  DEBUG = 'DEBUG',
  VERBOSE = 'VERBOSE',
}

export class GetLogsDto {
  @ApiPropertyOptional({
    description: 'Número de página',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de registros por página',
    minimum: 1,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Nivel de log para filtrar',
    enum: LogLevel,
  })
  @IsOptional()
  @IsEnum(LogLevel)
  level?: LogLevel;

  @ApiPropertyOptional({
    description:
      'Contexto/módulo para filtrar (ej: InstanceLoader, RoutesResolver)',
  })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional({
    description: 'Buscar en el mensaje del log',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
