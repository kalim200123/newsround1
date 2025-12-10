"use client";

import { getTopicDetail } from "@/lib/api/topics";
import { Topic } from "@/lib/types/topic";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import CategoryNewsClientPage from "./CategoryNewsClientPage";
import ChatRoom from "./ChatRoom";
import LoadingSpinner from "./common/LoadingSpinner";

interface CategoryPageLayoutProps {
  categoryName: string;
}

const categoryTopicMap: { [key: string]: number } = {
  정치: 2,
  경제: 3,
  사회: 4,
  문화: 5,
  스포츠: 6,
};

export default function CategoryPageLayout({ categoryName }: CategoryPageLayoutProps) {
  const { token } = useAuth();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const topicId = categoryTopicMap[categoryName];

  useEffect(() => {
    const fetchTopic = async () => {
      if (!topicId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const topicData = await getTopicDetail(String(topicId));
        setTopic(topicData.topic);
      } catch (error) {
        console.error("Failed to fetch topic for chat:", error);
        // Fallback: Create a dummy topic so chat works (optimistically)
        // This allows the chat window to be active ("input") even if the topic detail is missing/404
        setTopic({
          id: topicId,
          display_name: `${categoryName} 실시간 채팅`,
          summary: "자유롭게 의견을 나누세요.",
          published_at: new Date().toISOString(),
          view_count: 0,
          category: categoryName,
        } as Topic); // Type assertion to satisfy interface
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopic();
  }, [topicId]);

  if (!topicId) {
    return <CategoryNewsClientPage categoryName={categoryName} />;
  }

  return (
    <div className="relative min-h-screen">
      {/* Main Content Area */}
      <CategoryNewsClientPage categoryName={categoryName} />

      {/* Fixed Chat Panel in the right margin, only shown if logged in */}
      {token && (
        <div className="fixed hidden xl:block top-24 right-0 w-[320px] h-[calc(100vh-7rem)] pr-4 z-40">
          {isLoading ? (
            <div className="flex items-center justify-center h-full bg-card border border-border rounded-2xl">
              <LoadingSpinner />
            </div>
          ) : (
            <ChatRoom topic={topic || undefined} />
          )}
        </div>
      )}
    </div>
  );
}
