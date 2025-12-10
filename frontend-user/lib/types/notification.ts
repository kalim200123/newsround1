// lib/types/notification.ts

export enum NotificationType {
  NEW_TOPIC = 'NEW_TOPIC',
  BREAKING_NEWS = 'BREAKING_NEWS',
  EXCLUSIVE_NEWS = 'EXCLUSIVE_NEWS',
  VOTE_REMINDER = 'VOTE_REMINDER',
  ADMIN_NOTICE = 'ADMIN_NOTICE',
  FRIEND_REQUEST = 'FRIEND_REQUEST', // New
}

export interface NotificationMetadata {
  source?: string;
  source_domain?: string;
  thumbnail_url?: string;
  published_at?: string;
}

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  url: string;
  is_read: boolean;
  created_at: string; // ISO 8601 string
  metadata?: NotificationMetadata;
}
