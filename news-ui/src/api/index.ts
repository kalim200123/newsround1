// src/api/index.ts
import axios from "axios";
import type { Article, Topic } from "../types";

// API ?œë²„??ê¸°ë³¸ ì£¼ì†Œë¥??¤ì •?©ë‹ˆ??
export const apiClient = axios.create({
  baseURL: "http://localhost:3000",
});

// GET /api/topics
export const fetchPublishedTopics = async (): Promise<Topic[]> => {
  const response = await apiClient.get("/api/topics");
  return response.data;
};

// GET /api/topics/:topicId
export const fetchTopicDetails = async (topicId: string): Promise<{ topic: Topic; articles: Article[] }> => {
  const response = await apiClient.get(`/api/topics/${topicId}`);
  return response.data;
};

// --- ê´€ë¦¬ì??API ---

// GET /admin/topics/suggested
export const fetchSuggestedTopics = async (): Promise<Topic[]> => {
  const response = await apiClient.get("/admin/topics/suggested");
  return response.data;
};

// ... (?´í›„ ?¤ë¥¸ ëª¨ë“  API ?¸ì¶œ ?¨ìˆ˜?¤ì„ ?¬ê¸°??ì¶”ê??©ë‹ˆ??

