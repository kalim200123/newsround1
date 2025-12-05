// src/types/index.ts
export interface Topic {
  id: number;
  display_name: string | null;
  sub_description?: string;
  summary?: string;
  published_at?: string;
  collection_status?: string | null;
  // ROUND2 필드
  embedding_keywords?: string;
  stance_left?: string;
  stance_right?: string;
  vote_start_at?: string;
  vote_end_at?: string;
  vote_count_left?: number;
  vote_count_right?: number;
  // 관리자 페이지용 필드
  core_keyword?: string;
  status?: "PREPARING" | "OPEN" | "CLOSED" | "suggested" | "published" | "rejected" | "archived"; // 하위호환
  search_keywords?: string; // deprecated, use embedding_keywords
}

export interface Article {
  id: number;
  title: string;
  source: string;
  source_domain: string;
  status: "suggested" | "published" | "rejected" | "deleted";
  side?: "LEFT" | "RIGHT" | "CENTER";
  url?: string;
  published_at?: string;
  is_featured?: boolean;
  rss_desc?: string;
  thumbnail_url?: string;
  similarity?: number;
}
