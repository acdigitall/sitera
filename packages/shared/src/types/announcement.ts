export type AnnouncementCategory =
  | 'Bakım'
  | 'Aidat'
  | 'Genel'
  | 'Toplantı'
  | 'Acil'
  | 'Kesinti';

export type AnnouncementTargetScope = 'all' | 'block' | 'unit' | 'role';
export type AnnouncementStatus = 'published' | 'scheduled' | 'draft' | 'archived';

export interface AnnouncementReadReceipt {
  userId: string;
  userName: string;
  unit: string;
  readAt: string;
}

export interface AnnouncementReadStats {
  totalTargetUnits: number;
  readCount: number;
  readPercentage: number;
  reads: AnnouncementReadReceipt[];
  unreadUnits: string[];
}

export interface Announcement {
  id: string;
  groupId: string;
  authorId?: string | null;
  authorName?: string | null;
  title: string;
  content: string;
  category: AnnouncementCategory;
  isImportant: boolean;

  // 1. Hedefleme (Targeting)
  targetScope: AnnouncementTargetScope;
  targetBlocks?: string[] | null;
  targetUnits?: string[] | null;
  targetRole?: 'all' | 'owner' | 'resident' | null;

  // 2. Zamanlama (Scheduled Publishing)
  status: AnnouncementStatus;
  publishAt?: string | null;

  // 3. Okundu Takibi (Read Receipts)
  readReceipts?: AnnouncementReadReceipt[];
  readCount?: number;
  totalTargetUnits?: number;
  readPercentage?: number;

  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  category?: AnnouncementCategory;
  isImportant?: boolean;
  targetScope?: AnnouncementTargetScope;
  targetBlocks?: string[];
  targetUnits?: string[];
  targetRole?: 'all' | 'owner' | 'resident';
  status?: AnnouncementStatus;
  publishAt?: string | null;
}

export interface MarkAnnouncementReadDto {
  userId?: string;
  userName?: string;
  unit?: string;
}
