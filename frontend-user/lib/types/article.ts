/**
 * API에서 받아오는 기사(Article) 데이터 구조 정의
 */
export interface Article {
  id: number;
  source: string;
  source_domain: string;
  title: string;
  url: string;
  published_at: string;
  thumbnail_url: string;
  favicon_url: string | null;
  description?: string; // Added for search results
  summary?: string;
  side?: "LEFT" | "RIGHT" | "CENTER"; // Added for debate articles
  // 상세 페이지에서 추가되는 필드
  is_featured?: number;
  view_count?: number;
  comment_count?: number;
  isSaved?: boolean;
  category?: string;
  articleType?: "home" | "topic"; // Added for save/unsave functionality
}

export interface SavedArticle extends Article {
  saved_article_id: number;
  category_id: number | null;
}
