import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Group, GroupPlan } from '@sitera/shared';
import { UserEntity } from '../users/user.entity';

@Entity('groups')
export class GroupEntity implements Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 50, default: 'free' })
  plan: GroupPlan;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => UserEntity, (user) => user.group)
  users: UserEntity[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: string;
}
