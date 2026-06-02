import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import type { OrderStatus } from '../entities/order.entity';

const ORDER_STATUSES: OrderStatus[] = [
  'pending_payment',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

export class FilterOrdersDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: ORDER_STATUSES,
    description: 'Filtrar por estado',
  })
  @IsOptional()
  @IsString()
  @IsIn(ORDER_STATUSES)
  status?: OrderStatus;
}
