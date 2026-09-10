export type SupportTicketCategory =
  | 'finance_error'       // Kasa, Aidat veya Fatura Hatası
  | 'access_hardware'     // Bariyer, Plaka veya Kapı Donanımı
  | 'resident_data'       // Daire, Sakin veya İletişim Bilgisi
  | 'system_bug'          // Yazılım Hatası / Bug Bildirimi
  | 'general';            // Genel Soru / Mevzuat / Danışmanlık

export type SupportTicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export type SupportTicketStatus =
  | 'open'                 // Yeni Açıldı / Bekliyor
  | 'in_progress'          // İnceleniyor / Destek Veriliyor
  | 'waiting_admin_action' // Yöneticiden Bilgi Bekleniyor
  | 'resolved'             // Çözüldü
  | 'closed';              // Kapatıldı

export interface SupportTicketMessage {
  id: string;
  senderRole: 'tenant_admin' | 'superadmin';
  senderName: string;
  senderUserId: string;
  content: string;
  attachments?: string[];
  createdAt: string;
}

export interface PlatformSupportTicket {
  id: string;
  groupId: string;
  groupName: string;
  groupSlug: string;
  creatorUserId: string;
  creatorName: string;
  creatorEmail: string;
  creatorPhone?: string;
  subject: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  allowSiteAccess: boolean; // KVKK & Teknik İnceleme İzni
  accessGrantedUntil?: string;
  messages: SupportTicketMessage[];
  lastInteractedAt: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
}

export interface CreateSupportTicketDto {
  groupId: string;
  groupName?: string;
  groupSlug?: string;
  creatorUserId: string;
  creatorName: string;
  creatorEmail: string;
  creatorPhone?: string;
  subject: string;
  category: SupportTicketCategory;
  priority?: SupportTicketPriority;
  initialMessage: string;
  allowSiteAccess: boolean; // KVKK Onayı
}

export interface AddSupportTicketMessageDto {
  senderRole: 'tenant_admin' | 'superadmin';
  senderName: string;
  senderUserId: string;
  content: string;
  attachments?: string[];
}
