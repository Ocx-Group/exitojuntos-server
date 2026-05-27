import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

export type TransactionType = 'payment' | 'refund';
export type TransactionStatus = 'pending' | 'awaiting_confirmations' | 'approved' | 'failed' | 'cancelled';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id!: number;

  @Index('idx_transactions_order')
  @Column({ name: 'order_id', type: 'int' })
  orderId!: number;

  @Column({ type: 'varchar', length: 20 })
  type!: TransactionType;

  @Index('idx_transactions_status')
  @Column({ type: 'varchar', length: 30, default: 'pending' })
  status!: TransactionStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency!: string;

  @Column({ name: 'payment_method', type: 'varchar', length: 50, default: 'crypto' })
  paymentMethod!: string;

  @Column({ name: 'crypto_currency', type: 'varchar', length: 20, nullable: true })
  cryptoCurrency!: string | null;

  @Column({ name: 'crypto_network', type: 'varchar', length: 50, nullable: true })
  cryptoNetwork!: string | null;

  @Column({ name: 'crypto_amount', type: 'decimal', precision: 36, scale: 18, nullable: true })
  cryptoAmount!: number | null;

  @Column({ name: 'exchange_rate', type: 'decimal', precision: 20, scale: 8, nullable: true })
  exchangeRate!: number | null;

  @Column({ name: 'wallet_to', type: 'varchar', length: 255, nullable: true })
  walletTo!: string | null;

  @Column({ name: 'wallet_from', type: 'varchar', length: 255, nullable: true })
  walletFrom!: string | null;

  @Column({ name: 'tx_hash', type: 'varchar', length: 255, nullable: true, unique: true })
  txHash!: string | null;

  @Column({ type: 'int', default: 0 })
  confirmations!: number;

  @Column({ name: 'gateway_response', type: 'jsonb', nullable: true })
  gatewayResponse!: Record<string, unknown> | null;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason!: string | null;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order!: Order;
}
