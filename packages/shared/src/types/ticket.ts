export type TicketCategory =
  | 'Peyzaj & Bahçe'
  | 'Asansör & Elektrik'
  | 'Temizlik & Hijyen'
  | 'Güvenlik & Kapı'
  | 'Sıhhi Tesisat'
  | 'Ortak Alan & Demirbaş'
  | 'Diğer';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type TicketUrgency = 'low' | 'normal' | 'high' | 'urgent';

export interface IssueTicket {
  id: string;
  groupId: string;
  userId?: string | null;
  unit: string;
  residentName: string;
  residentPhone?: string | null;
  title: string;
  description: string;
  category: TicketCategory;
  location?: string | null;
  urgency: TicketUrgency;
  photos: string[]; // Base64 data URIs or image URLs
  status: TicketStatus;
  adminNotes?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketDto {
  unit: string;
  residentName: string;
  residentPhone?: string;
  title: string;
  description: string;
  category: TicketCategory;
  location?: string;
  urgency?: TicketUrgency;
  photos?: string[];
}

export interface UpdateTicketStatusDto {
  status: TicketStatus;
  adminNotes?: string;
}
