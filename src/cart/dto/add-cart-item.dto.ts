import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

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
}
