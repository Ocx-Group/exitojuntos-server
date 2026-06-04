import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetExternalEnabledDto {
  @ApiProperty({
    example: true,
    description: 'Mostrar (true) u ocultar (false) el botón externo en este producto.',
  })
  @IsBoolean()
  enabled!: boolean;
}
