import { Article } from "@/lib/types/article";
import { cn } from "@/lib/utils";
import { AlertCircle, Star } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import Favicon from "./common/Favicon"; // Import Favicon

import { FAVICON_URLS } from "@/lib/constants";

interface BreakingNewsTabsProps {
  breakingNews?: Article[];
  exclusiveNews?: Article[];
}

const ArticleItem = ({ article, type }: { article: Article; type: "breaking" | "exclusive" }) => {
  // Remove existing [속보], [단독], (속보), (단독) etc from the title to avoid duplication
  const cleanedTitle = article.title
    .replace(/^\[(속보|단독)\]\s*/, "")
    .replace(/^\((속보|단독)\)\s*/, "")
    .trim();

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ type: "article", ...article }));
    e.dataTransfer.effectAllowed = "copy";
  };

  const faviconSrc = FAVICON_URLS[article.source_domain] || article.favicon_url || "/placeholder.png";

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 group p-2 rounded-lg hover:bg-accent transition-colors bg-card"
      draggable
      onDragStart={handleDragStart}
    >
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          <span className={cn("mr-1.5", type === "breaking" ? "text-red-500" : "text-blue-500")}>
            [{type === "breaking" ? "속보" : "단독"}]
          </span>
          {cleanedTitle}
        </p>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          <Favicon src={faviconSrc} alt="" size={14} className="w-3.5 h-3.5 rounded-sm" />
          <span className="truncate">{article.source}</span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span suppressHydrationWarning>
            {new Date(article.published_at.replace("Z", "")).toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </a>
  );
};

export default function BreakingNewsTabs({ breakingNews = [], exclusiveNews = [] }: BreakingNewsTabsProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [activeTab, setActiveTab] = useState<"breaking" | "exclusive">("breaking");

  const currentArticles = activeTab === "breaking" ? breakingNews : exclusiveNews;

  return (
    <div className="flex flex-col h-full">
      {/* Header with Tabs */}
      <div className={`p-4 ${isDarkMode ? "bg-black" : "bg-white"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeTab === "breaking" ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : (
              <Star className="w-5 h-5 text-blue-500" />
            )}
            <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
              {activeTab === "breaking" ? (
                <span className="text-red-500">속보</span>
              ) : (
                <span className="text-blue-500">단독</span>
              )}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab("breaking")}
              className={cn(
                "px-2 py-1 text-xs font-bold rounded-md transition-colors",
                activeTab === "breaking"
                  ? "bg-red-600 text-white"
                  : "bg-secondary text-muted-foreground hover:bg-accent"
              )}
            >
              속보
            </button>
            <button
              onClick={() => setActiveTab("exclusive")}
              className={cn(
                "px-2 py-1 text-xs font-bold rounded-md transition-colors",
                activeTab === "exclusive"
                  ? "bg-blue-600 text-white"
                  : "bg-secondary text-muted-foreground hover:bg-accent"
              )}
            >
              단독
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-4 px-1 space-y-2 bg-secondary">
        {currentArticles.length === 0 ? (
          <p className="text-center text-muted-foreground pt-10">
            {activeTab === "breaking" ? "속보 뉴스가 없습니다." : "단독 뉴스가 없습니다."}
          </p>
        ) : (
          currentArticles
            .slice(0, 5)
            .map((article) => <ArticleItem key={article.id} article={article} type={activeTab} />)
        )}
      </div>
    </div>
  );
}
