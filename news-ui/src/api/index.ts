// src/api/index.ts
import axios from "axios";
import type { Article, Topic } from "../types";

// API client 설정
export const apiClient = axios.create({});

// GET /api/topics
export const fetchPublishedTopics = async (): Promise<Topic[]> => {
  const response = await apiClient.get("/api/topics/popular-all");
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
  const response = await apiClient.get("/api/admin/topics/suggested");
  return response.data;
};
