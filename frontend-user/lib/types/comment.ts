/**
 * API에서 받아오는 댓글(Comment) 데이터 구조 정의
 */
export interface Comment {
  id: number;
  author_id?: number; // Mapped from API's user_id
  author_name: string; // Mapped from API's nickname
  profile_image_url?: string; // Mapped from API's profile_image_url
  content: string;
  created_at: string;
  status?: "ACTIVE" | "HIDDEN" | "DELETED_BY_USER" | "DELETED_BY_ADMIN"; // Updated based on new status policy
  parent_id?: number | null; // Mapped from API's parent_comment_id
  stance?: "LEFT" | "RIGHT" | "NEUTRAL"; // For topic comments
  children?: Comment[]; // Mapped from API's replies
  like_count?: number;
  dislike_count?: number;
  my_reaction?: "LIKE" | "DISLIKE" | null;
}

// Interface for raw API comment response, including nested replies
export interface ApiComment {
  id: number;
  content: string;
  parent_comment_id: number | null;
  created_at: string;
  updated_at?: string;
  status?: string;
  user_id?: number; // Present in GET response
  nickname: string;
  profile_image_url?: string;
  avatar_url?: string;
  stance?: "LEFT" | "RIGHT" | "NEUTRAL";
  replies?: ApiComment[]; // Nested replies
}
