import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class InvoiceLineItemDto {
  @ApiProperty({ example: 'Ticket Crypto Jackpot' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity!: number;

  @ApiProperty({ example: 49.99, description: 'Precio unitario del ítem' })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount!: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ example: 99.98, description: 'Monto total de la factura' })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount!: number;

  @ApiPropertyOptional({
    example: '5057',
    description:
      'Id de moneda de CoinPayments. Si se omite usa la configurada por defecto.',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ type: [InvoiceLineItemDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  items!: InvoiceLineItemDto[];

  @ApiPropertyOptional({ example: 'Compra en Éxito Juntos' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: 'https://server.exitojuntos.com/v1/coinpayments/webhook',
    description:
      'URL a la que CoinPayments enviará las notificaciones de esta factura.',
  })
  @IsOptional()
  @IsUrl()
  notificationsUrl?: string;
}
