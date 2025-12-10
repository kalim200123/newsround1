// lib/types/topic.ts
import { Article } from "./article";

export interface TopicPreview {
  id: number;
  display_name: string;
  summary?: string;
  status: string;
  left_count: number;
  right_count: number;
  vote_remaining_time: string | null;
  vote_start_at?: string;
  vote_end_at?: string;
}

/**
 * API에서 받아오는 토픽(Topic) 데이터 구조 정의
 */
export interface Topic {
  id: number;
  display_name: string;
  summary: string;
  published_at: string;
  view_count: number;
  popularity_score?: number;
  total_votes?: number;
  comment_count?: number;
  collection_status?: string;
  vote_count_left?: number;
  vote_count_right?: number;
  stance_left?: string;
  stance_right?: string;
  vote_start_at?: string;
  vote_end_at?: string;
  my_vote?: "LEFT" | "RIGHT" | null;
  pro_votes?: number;
  con_votes?: number;
  category?: string;
}

/**
 * API에서 받아오는 특정 토픽 상세 데이터 구조 정의
 */
export interface TopicDetail {
  topic: Topic;
  articles: Article[];
}

export interface TrendingKeyword {
  keyword: string;
  article_count: number;
  source_count: number;
  articles: Article[];
}
