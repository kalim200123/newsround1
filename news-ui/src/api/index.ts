// src/api/index.ts
import axios from "axios";
import type { Article, Topic } from "../types";

// API ?쒕쾭??湲곕낯 二쇱냼瑜??ㅼ젙?⑸땲??
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "",
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

// --- 愿由ъ옄??API ---

// GET /admin/topics/suggested
export const fetchSuggestedTopics = async (): Promise<Topic[]> => {
  const response = await apiClient.get("/admin/topics/suggested");
  return response.data;
};

// ... (?댄썑 ?ㅻⅨ 紐⑤뱺 API ?몄텧 ?⑥닔?ㅼ쓣 ?ш린??異붽??⑸땲??





