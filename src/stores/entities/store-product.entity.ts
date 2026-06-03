import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Store } from './store.entity';

@Entity('store_products')
@Unique(['storeId', 'productId'])
export class StoreProduct {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id!: number;

  @Index('idx_store_products_store')
  @Column({ name: 'store_id', type: 'int' })
  storeId!: number;

  @Column({ name: 'product_id', type: 'int' })
  productId!: number;

  @Column({ type: 'boolean', default: true })
  featured!: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ name: 'custom_pitch', type: 'text', nullable: true })
  customPitch!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}
