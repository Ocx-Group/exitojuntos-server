import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export type StoreStatus = 'active' | 'paused';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id!: number;

  @Index('idx_stores_owner')
  @Column({ name: 'owner_user_id', type: 'bigint' })
  ownerUserId!: number;

  @Index('uniq_store_token', { unique: true })
  @Column({ name: 'public_token', type: 'uuid' })
  publicToken!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({ type: 'text', nullable: true })
  tagline!: string | null;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl!: string | null;

  @Column({ name: 'banner_url', type: 'text', nullable: true })
  bannerUrl!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  theme!: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: StoreStatus;

  @Column({ name: 'is_default', type: 'boolean', default: true })
  isDefault!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_user_id' })
  owner!: User;
}
