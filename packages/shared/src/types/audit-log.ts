export type AuditLogLevel = 'INFO' | 'WARN' | 'SECURITY' | 'CRITICAL';

export type AuditLogCategory =
  | 'AUTH'
  | 'FINANCE'
  | 'EXPENSE'
  | 'TICKET'
  | 'USER'
  | 'ANNOUNCEMENT'
  | 'SECURITY';

export interface AuditLog {
  id: string;
  groupId?: string | null;
  userId?: string | null;
  userName?: string | null;
  userRole?: string | null;
  action: string;
  category: AuditLogCategory;
  level: AuditLogLevel;
  resource?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface CreateAuditLogDto {
  action: string;
  category: AuditLogCategory;
  level?: AuditLogLevel;
  resource?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}
