// src/types/index.ts
export interface Topic {
  id: number;
  display_name: string | null;
  sub_description?: string;
  summary?: string;
  published_at?: string;
  collection_status?: string | null;
  // 관리자 페이지용 필드
  core_keyword?: string;
  status?: "suggested" | "published" | "rejected" | "archived";
  search_keywords?: string;
}

export interface Article {
  id: number;
  title: string;
  source: string;
  source_domain: string;
  status: "suggested" | "published" | "rejected" | "deleted";
  side?: "LEFT" | "RIGHT";
  url?: string;
  published_at?: string;
  is_featured?: boolean;
  rss_desc?: string;
  thumbnail_url?: string;
  similarity?: number;
}
