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
import {
  Announcement,
  AnnouncementCategory,
  AnnouncementTargetScope,
  AnnouncementStatus,
  AnnouncementReadReceipt,
} from '@sitera/shared';
import { GroupEntity } from '../groups/group.entity';
import { UserEntity } from '../users/user.entity';

@Entity('announcements')
export class AnnouncementEntity implements Announcement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'group_id' })
  groupId: string;

  @ManyToOne(() => GroupEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group?: GroupEntity;

  @Index()
  @Column({ type: 'uuid', name: 'author_id', nullable: true })
  authorId?: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'author_id' })
  author?: UserEntity | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  authorName?: string | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 50, default: 'Genel' })
  category: AnnouncementCategory;

  @Column({ type: 'boolean', default: false })
  isImportant: boolean;

  // 1. Hedefleme (Targeting)
  @Column({ type: 'varchar', length: 20, default: 'all' })
  targetScope: AnnouncementTargetScope;

  @Column({ type: 'jsonb', nullable: true, default: null })
  targetBlocks?: string[] | null;

  @Column({ type: 'jsonb', nullable: true, default: null })
  targetUnits?: string[] | null;

  @Column({ type: 'varchar', length: 20, default: 'all', nullable: true })
  targetRole?: 'all' | 'owner' | 'resident' | null;

  // 2. Zamanlama (Scheduled Publishing)
  @Column({ type: 'varchar', length: 20, default: 'published' })
  status: AnnouncementStatus;

  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  publishAt?: string | null;

  // 3. Okundu Takibi (Read Receipts)
  @Column({ type: 'jsonb', default: () => "'[]'" })
  readReceipts: AnnouncementReadReceipt[];

  // Transient / Hesaplanmış İstatistikler
  readCount?: number;
  totalTargetUnits?: number;
  readPercentage?: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: string;
}
