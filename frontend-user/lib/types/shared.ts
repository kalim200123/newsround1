import { Article } from './article';
import { TopicPreview } from './topic';

/**
 * 채팅 메시지 데이터 구조
 */
export interface Message {
  id: number;
  author: string;
  message: string;
  profile_image_url?: string;
  created_at: string;
  isHidden?: boolean;
  article_preview?: Article | null;
  topic_preview?: TopicPreview | null;
  isPending?: boolean;
}

export interface SavedArticleCategory {
  id: number;
  name: string;
  created_at?: string;
  article_count?: number;
}

export type NotificationType = "NEW_TOPIC" | "BREAKING_NEWS" | "EXCLUSIVE_NEWS" | "VOTE_REMINDER" | "ADMIN_NOTICE" | "FRIEND_REQUEST";

export interface NotificationSetting {
  notificationType: NotificationType;
  isEnabled: boolean;
}

/**
 * @interface ToggleSaveResponse
 * @description 기사 저장/취소 API의 응답 형식을 정의합니다.
 */
export interface ToggleSaveResponse {
  success: boolean;
  message?: string;
  isSaved?: boolean; // 저장 상태를 명시적으로 반환할 경우
}

export interface LinkMetadata {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
}
