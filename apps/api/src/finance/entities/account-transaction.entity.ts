import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AccountTransaction, TransactionType } from '@sitera/shared';
import { GroupEntity } from '../../groups/group.entity';
import { FinanceAccountEntity } from './finance-account.entity';

@Entity('account_transactions')
export class AccountTransactionEntity implements AccountTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'group_id' })
  groupId: string;

  @ManyToOne(() => GroupEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group?: GroupEntity;

  @Index()
  @Column({ type: 'uuid', name: 'account_id' })
  accountId: string;

  @ManyToOne(() => FinanceAccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account?: FinanceAccountEntity;

  @Column({ type: 'varchar', length: 150, nullable: true })
  accountName?: string;

  @Column({ type: 'varchar', length: 50 })
  type: TransactionType;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  amount: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  balanceAfter: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  counterparty?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  referenceType?: 'payment' | 'expense' | 'transfer' | 'initial_balance';

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceId?: string | null;

  @Column({ type: 'varchar', length: 50 })
  transactionDate: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;
}
