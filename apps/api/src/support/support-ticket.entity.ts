import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  PlatformSupportTicket,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
  SupportTicketMessage,
} from '@sitera/shared';

@Entity('platform_support_tickets')
export class SupportTicketEntity implements PlatformSupportTicket {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string; // örn: TKT-1049

  @Column({ type: 'uuid', name: 'group_id' })
  groupId: string;

  @Column({ type: 'varchar', length: 150, name: 'group_name' })
  groupName: string;

  @Column({ type: 'varchar', length: 100, name: 'group_slug' })
  groupSlug: string;

  @Column({ type: 'varchar', length: 100, name: 'creator_user_id' })
  creatorUserId: string;

  @Column({ type: 'varchar', length: 150, name: 'creator_name' })
  creatorName: string;

  @Column({ type: 'varchar', length: 150, name: 'creator_email' })
  creatorEmail: string;

  @Column({ type: 'varchar', length: 50, name: 'creator_phone', nullable: true })
  creatorPhone?: string;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'varchar', length: 50, default: 'general' })
  category: SupportTicketCategory;

  @Column({ type: 'varchar', length: 50, default: 'normal' })
  priority: SupportTicketPriority;

  @Column({ type: 'varchar', length: 50, default: 'open' })
  status: SupportTicketStatus;

  @Column({ type: 'boolean', name: 'allow_site_access', default: true })
  allowSiteAccess: boolean; // KVKK & Teknik İnceleme İzni

  @Column({ type: 'timestamp with time zone', name: 'access_granted_until', nullable: true })
  accessGrantedUntil?: string;

  @Column({ type: 'jsonb', default: [] })
  messages: SupportTicketMessage[];

  @Column({ type: 'timestamp with time zone', name: 'last_interacted_at' })
  lastInteractedAt: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: string;

  @Column({ type: 'timestamp with time zone', name: 'resolved_at', nullable: true })
  resolvedAt?: string | null;

  @Column({ type: 'varchar', length: 150, name: 'resolved_by', nullable: true })
  resolvedBy?: string | null;
}
