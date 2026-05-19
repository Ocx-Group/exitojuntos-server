import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('countries')
export class Country {
  @PrimaryGeneratedColumn('increment', { type: 'integer' })
  id!: number;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  iso3!: string;

  @Column({ type: 'text', nullable: true, name: 'numeric_code' })
  numericCode!: string;

  @Column({ type: 'text', nullable: true })
  iso2!: string;

  @Column({ type: 'text', nullable: true, name: 'phone_code' })
  phoneCode!: string;

  @Column({ type: 'text', nullable: true })
  capital!: string;

  @Column({ type: 'text', nullable: true })
  currency!: string;

  @Column({ type: 'text', nullable: true, name: 'currency_name' })
  currencyName!: string;

  @Column({ type: 'text', nullable: true, name: 'currency_symbol' })
  currencySymbol!: string;

  @Column({ type: 'text', nullable: true })
  tld!: string;

  @Column({ type: 'text', nullable: true })
  native!: string;

  @Column({ type: 'text', nullable: true })
  region!: string;

  @Column({ type: 'text', nullable: true })
  subregion!: string;

  @Column({ type: 'numeric', nullable: true })
  latitude!: number;

  @Column({ type: 'numeric', nullable: true })
  longitude!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date;
}
