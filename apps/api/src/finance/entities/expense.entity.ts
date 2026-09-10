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
import { Expense } from '@sitera/shared';
import { GroupEntity } from '../../groups/group.entity';

@Entity('expenses')
export class ExpenseEntity implements Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'group_id' })
  groupId: string;

  @ManyToOne(() => GroupEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group?: GroupEntity;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 150 })
  vendor: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

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

  @Column({ type: 'date' })
  dueDate: string;

  @Column({ type: 'varchar', length: 10 })
  dueDay: string;

  @Column({ type: 'varchar', length: 10 })
  dueMonth: string;

  @Column({ type: 'varchar', length: 50, default: 'unpaid' })
  status: 'unpaid' | 'paid' | 'auto';

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: string;
}
