import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('testimonials')
export class Testimonial {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  role!: string;

  @Column({ type: 'text' })
  quote!: string;

  @Column({ type: 'text', nullable: true })
  avatar!: string | null;

  @Column({ type: 'text', nullable: true, name: 'video_url' })
  videoUrl!: string | null;

  @Column({ type: 'int', default: 5 })
  stars!: number;

  @Column({ type: 'int', default: 0, name: 'display_order' })
  displayOrder!: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date | null;
}
