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
import { Payment, PaymentChannel, PaymentStatus } from '@sitera/shared';
import { GroupEntity } from '../../groups/group.entity';
import { UserEntity } from '../../users/user.entity';
import { DebtEntity } from './debt.entity';

@Entity('payments')
export class PaymentEntity implements Payment {
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
  @Column({ type: 'uuid', name: 'debt_id', nullable: true })
  debtId?: string | null;

  @ManyToOne(() => DebtEntity, (debt) => debt.payments, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'debt_id' })
  debt?: DebtEntity | null;

  @Column({ type: 'varchar', length: 100 })
  unit: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  residentName?: string | null;

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

  @Column({ type: 'varchar', length: 50, default: 'bank_transfer' })
  channel: PaymentChannel;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceNo?: string | null;

  @Column({ type: 'text', nullable: true })
  receiptUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: PaymentStatus;

  @Column({ type: 'uuid', name: 'approved_by', nullable: true })
  approvedBy?: string | null;

  @Column({ type: 'timestamp with time zone', name: 'approved_at', nullable: true })
  approvedAt?: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: string;
}
