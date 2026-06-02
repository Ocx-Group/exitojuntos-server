import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import type { TransactionType } from '../entities/transaction.entity';

export class CreateTransactionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  orderId!: number;

  @ApiProperty({ enum: ['payment', 'refund'] })
  @IsIn(['payment', 'refund'])
  type!: TransactionType;

  @ApiProperty({ example: 99.98 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount!: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ example: 'USDT' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cryptoCurrency?: string;

  @ApiPropertyOptional({ example: 'TRC20' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cryptoNetwork?: string;

  @ApiPropertyOptional({ example: 99.98 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  cryptoAmount?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  exchangeRate?: number;

  @ApiPropertyOptional({ example: 'TAddr...' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  walletTo?: string;

  @ApiPropertyOptional({ example: 'TAddr...' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  walletFrom?: string;

  @ApiPropertyOptional({ example: 'abc123hash' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  txHash?: string;

  @ApiPropertyOptional({ example: 'crypto', default: 'crypto' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentMethod?: string;
}
