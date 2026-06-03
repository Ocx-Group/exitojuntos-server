import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsUUID } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  productId!: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  quantity!: number;

  @ApiPropertyOptional({
    example: 'b3f1c2d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    description:
      'Token público de la tienda por la que llegó el comprador (atribución). Solo se aplica la primera vez en un carrito activo.',
  })
  @IsOptional()
  @IsUUID()
  storeToken?: string;
}
