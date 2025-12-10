"use client";

import { Article } from "@/lib/types/article";
import { Topic, TrendingKeyword } from "@/lib/types/topic";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BreakingNewsTabs from "./BreakingNewsTabs";
import ChatRoom from "./ChatRoom";
import TrendingKeywords from "./TrendingKeywords";
import TrendingTopics from "./TrendingTopics";

interface MainGridProps {
  mainTopic: Topic | undefined;
  popularTopics?: Topic[];
  latestTopics?: Topic[];
  trendingKeywords?: TrendingKeyword[];
  breakingNews?: Article[];
  exclusiveNews?: Article[];
}

export default function MainGrid({
  mainTopic,
  popularTopics = [],
  latestTopics = [],
  trendingKeywords = [],
  breakingNews = [],
  exclusiveNews = [],
}: MainGridProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [topicTab, setTopicTab] = useState<"popular" | "latest">("popular");
  const [selectedTopic] = useState<Topic | undefined>(mainTopic);

  const handleTopicSelect = (topic: Topic) => {
    router.push(`/debate/${topic.id}`);
  };

  const sectionClasses = cn(
    "bg-card border rounded-xl flex flex-col overflow-hidden",
    isDarkMode ? "border-white/10" : "border-border"
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
      {/* Left Column: Breaking News (top) + Issue NOW (bottom) */}
      <div className="hidden xl:flex flex-col gap-6 h-[600px] lg:h-[729px]">
        {/* Breaking News / Exclusive News - Top Half */}
        <div className="bg-card rounded-xl flex flex-col overflow-hidden flex-1">
          <BreakingNewsTabs breakingNews={breakingNews} exclusiveNews={exclusiveNews} />
        </div>

        {/* Issue NOW - Bottom Half */}
        <div className="bg-card rounded-xl flex flex-col overflow-hidden flex-1">
          <TrendingKeywords keywords={trendingKeywords} />
        </div>
      </div>

      {/* Center Column: ROUND1 Chat (2/4) */}
      <div className="xl:col-span-2 flex flex-col h-[600px] lg:h-[729px]">
        <div className="relative z-20 rounded-2xl flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0">
            <ChatRoom topic={selectedTopic} />
          </div>
        </div>
      </div>

      {/* Right Column: ROUND2 Topics (1/4) */}
      <div className="hidden xl:block h-[600px] lg:h-[729px]">
        <div className={cn(sectionClasses, "h-full")}>
          <div className={`p-4 ${isDarkMode ? "bg-black" : "bg-white"}`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>ROUND2</h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setTopicTab("popular")}
                  className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${
                    topicTab === "popular"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-accent"
                  }`}
                >
                  인기
                </button>
                <button
                  onClick={() => setTopicTab("latest")}
                  className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${
                    topicTab === "latest"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-accent"
                  }`}
                >
                  최신
                </button>
              </div>
            </div>
          </div>
          <hr className={isDarkMode ? "border-gray-700" : "border-gray-200"} />
          <div className="flex-1 min-h-0 p-4 bg-secondary">
            <TrendingTopics
              displayMode={topicTab}
              topics={topicTab === "popular" ? popularTopics : latestTopics}
              onTopicSelect={handleTopicSelect}
            />
          </div>
        </div>
      </div>

      {/* Mobile: Show Breaking News, Issue NOW and ROUND2 below chat */}
      <div className="xl:hidden col-span-1 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Breaking News - Mobile */}
        <div className={cn(sectionClasses, "min-h-[300px]")}>
          <BreakingNewsTabs breakingNews={breakingNews} exclusiveNews={exclusiveNews} />
        </div>

        {/* Issue NOW - Mobile */}
        <div className={cn(sectionClasses, "min-h-[300px]")}>
          <TrendingKeywords keywords={trendingKeywords} />
        </div>

        {/* ROUND2 - Mobile */}
        <div className={cn(sectionClasses, "min-h-[300px]", "md:col-span-2")}>
          <div className={`p-4 ${isDarkMode ? "bg-black" : "bg-white"}`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>ROUND2</h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setTopicTab("popular")}
                  className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${
                    topicTab === "popular"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-accent"
                  }`}
                >
                  인기
                </button>
                <button
                  onClick={() => setTopicTab("latest")}
                  className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${
                    topicTab === "latest"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-accent"
                  }`}
                >
                  최신
                </button>
              </div>
            </div>
          </div>
          <hr className={isDarkMode ? "border-gray-700" : "border-gray-200"} />
          <div className="flex-1 min-h-0 p-4 bg-secondary">
            <TrendingTopics
              displayMode={topicTab}
              topics={topicTab === "popular" ? popularTopics : latestTopics}
              onTopicSelect={handleTopicSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
