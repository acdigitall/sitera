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
import { AppNotification, NotificationType, NotificationPriority } from '@sitera/shared';
import { GroupEntity } from '../groups/group.entity';
import { UserEntity } from '../users/user.entity';

@Entity('notifications')
@Index(['groupId', 'userId', 'isRead'])
@Index(['createdAt'])
export class NotificationEntity implements AppNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'group_id' })
  groupId: string;

  @ManyToOne(() => GroupEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group?: GroupEntity;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 50, default: 'system' })
  type: NotificationType;

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  priority: NotificationPriority;

  @Index()
  @Column({ type: 'boolean', name: 'is_read', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp with time zone', name: 'read_at', nullable: true })
  readAt?: string | null;

  @Column({ type: 'varchar', length: 500, name: 'link_url', nullable: true })
  linkUrl?: string | null;

  @Column({ type: 'jsonb', nullable: true, default: () => "'{}'" })
  metadata?: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: string;
}
