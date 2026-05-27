import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class PersonalNetworkQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'ID del usuario raíz de la red (solo para administradores)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;
}
