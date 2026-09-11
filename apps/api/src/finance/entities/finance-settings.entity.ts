import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FinanceSettings } from '@sitera/shared';
import { GroupEntity } from '../../groups/group.entity';

@Entity('finance_settings')
export class FinanceSettingsEntity implements FinanceSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'uuid', name: 'group_id' })
  groupId: string;

  @ManyToOne(() => GroupEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group?: GroupEntity;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value !== null && value !== undefined && !isNaN(Number(value)) ? Number(value) : 0),
    },
  })
  defaultDuesAmount: number;

  @Column({ type: 'int', default: 30 })
  duesDueDay: number;

  @Column({ type: 'boolean', default: false })
  autoGenerateMonthlyDues: boolean;

  @Column({ type: 'varchar', length: 50, default: 'equal' })
  calculationMode: 'equal' | 'share' | 'unit_type';

  @Column({ type: 'boolean', default: true })
  lateFeeEnabled: boolean;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 5,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value !== null && value !== undefined && !isNaN(Number(value)) ? Number(value) : 5),
    },
  })
  lateFeeRate: number; // KMK %5

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value !== null && value !== undefined && !isNaN(Number(value)) ? Number(value) : 0),
    },
  })
  annualBudget: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: string;
}
