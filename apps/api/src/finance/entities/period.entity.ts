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
import { Period, PeriodStatus } from '@sitera/shared';
import { GroupEntity } from '../../groups/group.entity';
import { DebtEntity } from './debt.entity';

@Entity('periods')
export class PeriodEntity implements Period {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'group_id' })
  groupId: string;

  @ManyToOne(() => GroupEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group?: GroupEntity;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value) || 0,
  } })
  amount: number;

  @Column({ type: 'date' })
  dueDate: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: PeriodStatus;

  @OneToMany(() => DebtEntity, (debt) => debt.period)
  debts?: DebtEntity[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: string;
}
