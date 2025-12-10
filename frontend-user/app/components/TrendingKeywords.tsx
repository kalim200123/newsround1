"use client";

import { Article } from "@/lib/types/article";
import { TrendingKeyword } from "@/lib/types/topic";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

import Image from "next/image"; // Re-import Image

interface TrendingKeywordsProps {
  keywords: TrendingKeyword[];
}

const ArticleItem = ({ article }: { article: Article }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ type: "article", ...article }));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 group p-2 rounded-lg hover:bg-accent transition-colors"
      draggable
      onDragStart={handleDragStart}
    >
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">{article.title}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <Image // Changed from img to Image
            src={article.favicon_url || "/placeholder.png"}
            alt=""
            width={14} // specify width
            height={14} // specify height
            className="w-3.5 h-3.5"
          />
          <span className="truncate">{article.source}</span>
        </div>
      </div>
    </a>
  );
};

export default function TrendingKeywords({ keywords }: TrendingKeywordsProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [selectedKeywordIndex, setSelectedKeywordIndex] = useState(0);

  if (!keywords || keywords.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className={`p-4 ${isDarkMode ? "bg-black" : "bg-white"}`}>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500" />
            <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>이슈 NOW</h2>
          </div>
        </div>
        <hr className={isDarkMode ? "border-gray-700" : "border-gray-200"} />
        <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
          <p>현재 인기 키워드가 없습니다.</p>
        </div>
      </div>
    );
  }

  const selectedKeyword = keywords[selectedKeywordIndex];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`p-4 ${isDarkMode ? "bg-black" : "bg-white"}`}>
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-red-500" />
          <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>이슈 NOW</h2>
        </div>
      </div>

      {/* Content */}
      <div className="py-4 px-1 flex flex-col flex-1 min-h-0 bg-secondary">
        {/* Keyword Tabs */}
        <div className="flex items-center gap-0.5">
          {keywords.slice(0, 5).map((kw, index) => (
            <button
              key={kw.keyword}
              onClick={() => setSelectedKeywordIndex(index)}
              className={cn(
                "px-2 py-1 text-xs font-bold rounded-full transition-colors whitespace-nowrap",
                selectedKeywordIndex === index
                  ? "bg-red-600 text-white shadow-md"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              )}
            >
              #{kw.keyword}
            </button>
          ))}
        </div>

        {/* Article List */}
        <div className="flex-1 mt-2 space-y-2 px-1">
          {selectedKeyword.articles.slice(0, 3).map((article) => (
            <ArticleItem key={article.id} article={article} />
          ))}
        </div>
      </div>
    </div>
  );
}
