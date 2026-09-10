import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import {
  Group,
  GroupPlan,
  SubscriptionStatus,
  SaaSPaymentStatus,
  BillingCycle,
  GroupModuleSubscription,
} from '@sitera/shared';
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

  @Column({ type: 'int', default: 24, nullable: true })
  totalUnits?: number;

  @Column({ type: 'varchar', length: 100, nullable: true, default: 'İstanbul' })
  city?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, default: 'Kadıköy' })
  district?: string;

  // SaaS Abonelik, Fatura ve Lisans Alanları
  @Column({ type: 'varchar', length: 50, default: 'trial' })
  subscriptionStatus?: SubscriptionStatus;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 20, nullable: true })
  unitFee?: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 480 })
  monthlyFee?: number;

  @Column({ type: 'varchar', length: 20, default: 'monthly' })
  billingCycle?: BillingCycle;

  @Column({ type: 'timestamp with time zone', nullable: true })
  trialEndsAt?: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  licenseExpiresAt?: string | null;

  @Column({ type: 'varchar', length: 50, default: 'free_trial' })
  paymentStatus?: SaaSPaymentStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastPaymentDate?: string | null;

  @Column({ type: 'boolean', default: false })
  isFrozen?: boolean;

  @Column({ type: 'text', nullable: true })
  frozenReason?: string | null;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  modules?: GroupModuleSubscription[];

  // KVKK ve Platform Destek Müdahale Durumu
  @Column({ type: 'boolean', name: 'support_access_active', default: false })
  supportAccessActive?: boolean;

  @Column({ type: 'timestamp with time zone', name: 'support_access_granted_until', nullable: true })
  supportAccessGrantedUntil?: string | null;

  @Column({ type: 'varchar', length: 50, name: 'active_support_ticket_id', nullable: true })
  activeSupportTicketId?: string | null;

  @OneToMany(() => UserEntity, (user) => user.group)
  users: UserEntity[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: string;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: string;
}

