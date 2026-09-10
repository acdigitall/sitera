import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Debt, DebtCategory, DebtStatus, TargetRole } from '@sitera/shared';
import { GroupEntity } from '../../groups/group.entity';
import { UserEntity } from '../../users/user.entity';
import { PeriodEntity } from './period.entity';
import { PaymentEntity } from './payment.entity';

@Entity('debts')
export class DebtEntity implements Debt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'group_id' })
  groupId: string;

  @ManyToOne(() => GroupEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group?: GroupEntity;

  @Index()
  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId?: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity | null;

  @Index()
  @Column({ type: 'uuid', name: 'period_id', nullable: true })
  periodId?: string | null;

  @ManyToOne(() => PeriodEntity, (period) => period.debts, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'period_id' })
  period?: PeriodEntity | null;

  @Column({ type: 'varchar', length: 100 })
  unit: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  residentName?: string | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 50, default: 'dues' })
  category: DebtCategory;

  @Column({ type: 'varchar', length: 50, default: 'resident' })
  targetRole?: TargetRole;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  amount: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  paidAmount: number;

  @Column({ type: 'date' })
  dueDate: string;

  @Column({ type: 'varchar', length: 50, default: 'unpaid' })
  status: DebtStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  paidDate?: string | null;

  @OneToMany(() => PaymentEntity, (payment) => payment.debt)
  payments?: PaymentEntity[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: string;
}
