import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SpendRequestDto {
  @ApiProperty({ description: 'Dirección destino a la que enviar los fondos.' })
  @IsString()
  @MaxLength(255)
  toAddress!: string;

  @ApiProperty({ description: 'Id de la moneda destino del spend.' })
  @IsString()
  toCurrency!: string;

  @ApiProperty({
    example: '10.5',
    description: 'Monto a enviar (decimal como string).',
  })
  @IsString()
  amount!: string;

  @ApiPropertyOptional({
    description:
      'Moneda del campo amount en formato {CurrencyId}:{ContractAddress}.',
  })
  @IsOptional()
  @IsString()
  amountCurrency?: string;

  @ApiPropertyOptional({
    description: 'Sobreescribe la comisión de blockchain sugerida.',
  })
  @IsOptional()
  @IsString()
  blockchainFeeOverride?: string;

  @ApiPropertyOptional({
    description: 'Representación decimal del override de comisión.',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  blockchainFeeOverrideDecimal?: number;

  @ApiPropertyOptional({
    description: 'Nota opcional definida por el usuario.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  memo?: string;

  @ApiPropertyOptional({
    description:
      'Si es true el receptor paga la comisión; por defecto la paga el emisor.',
  })
  @IsOptional()
  @IsBoolean()
  receiverPaysFee?: boolean;
}

export class CreateMerchantWalletDto {
  @ApiProperty({ description: 'Id de la moneda del wallet.' })
  @IsString()
  currencyId!: string;

  @ApiPropertyOptional({
    description: 'Etiqueta opcional para identificar el wallet.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string;
}
