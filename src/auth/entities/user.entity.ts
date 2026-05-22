import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Role } from './role.entity';
import { Country } from './country.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  lastName!: string;

  @Column({ type: 'text', nullable: true })
  password?: string | null;

  @Index('IDX_USER_EMAIL')
  @Column({ type: 'text', unique: true })
  email!: string;

  @Index('IDX_USER_USERNAME')
  @Column({ type: 'text', unique: true })
  username!: string;

  @Index('IDX_USER_PHONE')
  @Column({ type: 'text', unique: true })
  phone!: string;

  @Index('IDX_USER_GOOGLE_ID', { unique: true, where: 'google_id IS NOT NULL' })
  @Column({ name: 'google_id', type: 'text', nullable: true })
  googleId?: string | null;

  @Column({ name: 'auth_provider', type: 'text', default: 'local' })
  authProvider!: string;

  @Column({ type: 'text', nullable: true })
  identification!: string;

  @Column({ type: 'text', nullable: true })
  address!: string;

  @Column({ type: 'text', nullable: true })
  city!: string;

  @Column({ type: 'text', nullable: true })
  state!: string;

  @Column({ type: 'text', nullable: true })
  zipCode!: string;

  @Column({ type: 'bigint', nullable: true })
  father!: number;

  @Column({ type: 'int', nullable: true })
  side!: number;

  @Column({ type: 'boolean', nullable: true })
  status!: boolean;

  @Column({ type: 'text', nullable: true })
  imageProfileUrl!: string;

  @Column({ type: 'text', nullable: true })
  verificationCode?: string;

  @Column({ type: 'text', nullable: true })
  resetPasswordCode?: string;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires?: Date;

  @Column({ type: 'boolean', nullable: true })
  termsConditions!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  birtDate!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date;

  @ManyToOne(() => Role, (role) => role.users, { nullable: true })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @ManyToOne(() => Country, { nullable: true })
  @JoinColumn({ name: 'country_id' })
  country!: Country;
}
