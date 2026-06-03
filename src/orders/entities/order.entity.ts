import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { OrderDetail } from './order-detail.entity';

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id!: number;

  @Index('idx_orders_user')
  @Column({ name: 'user_id', type: 'bigint' })
  userId!: number;

  @Index('idx_orders_status')
  @Column({ type: 'varchar', length: 30, default: 'pending_payment' })
  status!: OrderStatus;

  @Index('idx_orders_store')
  @Column({ name: 'store_id', type: 'int', nullable: true })
  storeId!: number | null;

  // Snapshot del dueño de la tienda al momento de la compra (atribución)
  @Column({ name: 'referrer_user_id', type: 'bigint', nullable: true })
  referrerUserId!: number | null;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal!: number;

  @Column({
    name: 'tax_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  taxAmount!: number;

  @Column({
    name: 'discount_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  discountAmount!: number;

  @Column({
    name: 'shipping_cost',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  shippingCost!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    insert: false,
    update: false,
  })
  total!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'shipping_email', type: 'varchar', length: 255 })
  shippingEmail!: string;

  @Column({ name: 'shipping_name', type: 'varchar', length: 255 })
  shippingName!: string;

  @Column({ name: 'shipping_address', type: 'varchar', length: 500 })
  shippingAddress!: string;

  @Column({ name: 'shipping_city', type: 'varchar', length: 100 })
  shippingCity!: string;

  @Column({ name: 'shipping_province', type: 'varchar', length: 100 })
  shippingProvince!: string;

  @Column({
    name: 'shipping_postal_code',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  shippingPostalCode!: string | null;

  @Column({
    name: 'shipping_phone',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  shippingPhone!: string | null;

  @Index('idx_orders_created')
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => OrderDetail, (detail) => detail.order, { cascade: true })
  details!: OrderDetail[];
}
