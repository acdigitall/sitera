import type { User } from './user.js';

export type GroupPlan = 'free' | 'starter' | 'pro' | 'enterprise';

export type SubscriptionStatus =
  | 'trial'         // Lansman / Ücretsiz Deneme Sürecinde
  | 'active'        // Lisansı Aktif ve Ödemeleri Düzenli
  | 'past_due'      // Ödeme Gecikmede / Süresi Dolmuş
  | 'grace_period'  // Süresi Doldu, 14 Günlük Salt Okunur Süreçte
  | 'canceled'      // İptal Edilmiş / Sistemden Ayrılmış
  | 'paused';       // Dondurulmuş / Askıya Alınmış

export type SaaSPaymentStatus = 'paid' | 'pending' | 'overdue' | 'free_trial';

export type BillingCycle = 'monthly' | 'yearly';

export type PlatformModuleCode =
  | 'ANPR_PLATE_RECOGNITION' // Plaka Tanıma & Bariyer Entegrasyonu
  | 'GUEST_QR_PASS'          // Tek Seferlik Misafir QR Geçiş İzni
  | 'SMART_INTERCOM'         // Akıllı İnterkom & Uzaktan Kapı Açma
  | 'FACILITY_RESERVATION'   // Tesis & Havuz Rezervasyon Yönetimi
  | 'VALET_PARKING';         // Vale & Otopark Yönetimi

export type ModulePricingModel = 'per_unit' | 'flat_monthly';

export interface PlatformModuleDefinition {
  code: PlatformModuleCode;
  name: string;
  shortDescription: string;
  detailedDescription: string;
  category: 'security' | 'access' | 'amenities' | 'iot';
  pricingModel: ModulePricingModel;
  defaultPrice: number; // örn. 5 (₺/daire) veya 200 (₺/site)
  requiredHardware?: string;
  iconName: string;
  badgeText?: string;
  isPopular?: boolean;
}

export interface GroupModuleSubscription {
  moduleCode: PlatformModuleCode;
  status: 'active' | 'trial' | 'inactive';
  activatedAt?: string;
  expiresAt?: string;
  price?: number;
  config?: Record<string, any>;
}

export interface Group {
  id: string;
  name: string;
  slug: string;
  plan: GroupPlan;
  isActive: boolean;
  totalUnits?: number;
  city?: string;
  district?: string;
  users?: User[];

  // SaaS Abonelik, Fatura & Lisans Alanları
  subscriptionStatus?: SubscriptionStatus;
  unitFee?: number; // Daire başı aylık SaaS lisans bedeli (₺)
  monthlyFee?: number; // Aylık Sitera'ya ödenen toplam SaaS lisans bedeli (₺)
  billingCycle?: BillingCycle;
  trialEndsAt?: string | null; // Lansman / ücretsiz kullanım bitiş tarihi
  licenseExpiresAt?: string | null; // Lisans bitiş tarihi
  paymentStatus?: SaaSPaymentStatus;
  lastPaymentDate?: string | null;
  isFrozen?: boolean;
  frozenReason?: string | null;

  // Modüler Eklenti & IoT Paket Abonelikleri
  modules?: GroupModuleSubscription[];

  // KVKK ve Platform Destek Müdahale Durumu
  supportAccessActive?: boolean;
  supportAccessGrantedUntil?: string | null;
  activeSupportTicketId?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupDto {
  name: string;
  slug: string;
  plan?: GroupPlan;
  totalUnits?: number;
  city?: string;
  district?: string;
  subscriptionStatus?: SubscriptionStatus;
  unitFee?: number;
  monthlyFee?: number;
  billingCycle?: BillingCycle;
  trialEndsAt?: string | null;
  licenseExpiresAt?: string | null;
  paymentStatus?: SaaSPaymentStatus;
  modules?: GroupModuleSubscription[];
}

export interface UpdateGroupDto {
  name?: string;
  plan?: GroupPlan;
  isActive?: boolean;
  totalUnits?: number;
  city?: string;
  district?: string;
  subscriptionStatus?: SubscriptionStatus;
  unitFee?: number;
  monthlyFee?: number;
  billingCycle?: BillingCycle;
  trialEndsAt?: string | null;
  licenseExpiresAt?: string | null;
  paymentStatus?: SaaSPaymentStatus;
  isFrozen?: boolean;
  frozenReason?: string | null;
  modules?: GroupModuleSubscription[];
}
