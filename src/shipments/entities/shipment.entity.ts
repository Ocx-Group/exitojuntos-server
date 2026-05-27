import { Column, CreateDateColumn, Entity, Index, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { ShipmentTracking } from './shipment-tracking.entity';

export type ShipmentStatus = 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned';

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id!: number;

  @Column({ name: 'order_id', type: 'int', unique: true })
  orderId!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  carrier!: string | null;

  @Index('idx_shipments_tracking')
  @Column({ name: 'tracking_number', type: 'varchar', length: 255, nullable: true })
  trackingNumber!: string | null;

  @Column({ type: 'varchar', length: 30, default: 'pending' })
  status!: ShipmentStatus;

  @Column({ name: 'estimated_delivery', type: 'date', nullable: true })
  estimatedDelivery!: string | null;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @OneToMany(() => ShipmentTracking, (tracking) => tracking.shipment, { cascade: true })
  trackingEvents!: ShipmentTracking[];
}
