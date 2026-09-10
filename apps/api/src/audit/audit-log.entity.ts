import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AuditLog, AuditLogCategory, AuditLogLevel } from '@sitera/shared';
import { GroupEntity } from '../groups/group.entity';
import { UserEntity } from '../users/user.entity';

@Entity('audit_logs')
export class AuditLogEntity implements AuditLog {
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

  @Column({ type: 'varchar', length: 150, nullable: true })
  userName?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  userRole?: string | null;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 50, default: 'SECURITY' })
  category: AuditLogCategory;

  @Column({ type: 'varchar', length: 20, default: 'INFO' })
  level: AuditLogLevel;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resource?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  details?: Record<string, any> | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ipAddress?: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent?: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;
}
