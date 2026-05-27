import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  quantity!: number;
}
