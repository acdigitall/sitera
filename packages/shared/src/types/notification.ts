export type NotificationType =
  | 'ticket_update'
  | 'payment_approval'
  | 'announcement'
  | 'debt_issued'
  | 'system';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface AppNotification {
  id: string;
  groupId: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  readAt?: string | null;
  linkUrl?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  linkUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationFilterDto {
  unreadOnly?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

export interface MarkNotificationReadDto {
  isRead?: boolean;
}
