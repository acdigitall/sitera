import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PlatformPosFee } from '@sitera/shared';
import { GroupEntity } from '../../groups/group.entity';

@Entity('platform_pos_fees')
export class PlatformPosFeeEntity implements PlatformPosFee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 100, name: 'payment_id' })
  paymentId: string;

  @Index()
  @Column({ type: 'uuid', name: 'group_id' })
  groupId: string;

  @ManyToOne(() => GroupEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group?: GroupEntity;

  @Column({ type: 'varchar', length: 150, nullable: true })
  siteName?: string;

  @Column({ type: 'varchar', length: 50 })
  unit: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  residentName?: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  grossAmount: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  netAmount: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  totalCommission: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  gatewayFee: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  siteraRevenue: number;

  @Column({ type: 'varchar', length: 50, default: 'completed' })
  status: 'completed' | 'refunded';

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;
}
