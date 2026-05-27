import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Shipment } from './shipment.entity';

@Entity('shipment_tracking')
export class ShipmentTracking {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id!: number;

  @Index('idx_shipment_tracking_shipment')
  @Column({ name: 'shipment_id', type: 'int' })
  shipmentId!: number;

  @Column({ type: 'varchar', length: 30 })
  status!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'occurred_at' })
  occurredAt!: Date;

  @ManyToOne(() => Shipment, (shipment) => shipment.trackingEvents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shipment_id' })
  shipment!: Shipment;
}
