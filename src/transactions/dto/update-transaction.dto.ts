import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import type { TransactionStatus } from '../entities/transaction.entity';

export class UpdateTransactionDto {
  @ApiPropertyOptional({ enum: ['pending', 'awaiting_confirmations', 'approved', 'failed', 'cancelled'] })
  @IsOptional()
  @IsIn(['pending', 'awaiting_confirmations', 'approved', 'failed', 'cancelled'])
  status?: TransactionStatus;

  @ApiPropertyOptional({ example: 'abc123hash' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  txHash?: string;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @IsInt()
  @Min(0)
  confirmations?: number;

  @ApiPropertyOptional()
  @IsOptional()
  failureReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  cryptoAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  exchangeRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  gatewayResponse?: Record<string, unknown>;
}
