"use client";

import { Article } from "@/lib/types/article";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import ArticleCard from "../ArticleCard";
import ClientPaginationControls from "../common/ClientPaginationControls";
import Favicon from "../common/Favicon";

interface MediaOutletSectionProps {
  articles: Article[];
  className?: string;
}

export default function MediaOutletSection({ articles, className }: MediaOutletSectionProps) {
  const [selectedOutlet, setSelectedOutlet] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Group articles by source
  const articlesBySource = useMemo(() => {
    const grouped: Record<string, Article[]> = {};
    articles.forEach((article) => {
      if (!grouped[article.source]) {
        grouped[article.source] = [];
      }
      grouped[article.source].push(article);
    });
    return grouped;
  }, [articles]);

  // Get top sources by article count
  const topSources = useMemo(() => {
    return Object.keys(articlesBySource).sort((a, b) => articlesBySource[b].length - articlesBySource[a].length);
  }, [articlesBySource]);

  const activeSource = selectedOutlet || topSources[0];
  const activeArticles = articlesBySource[activeSource] || [];

  // Pagination Logic
  const ARTICLES_PER_PAGE = 12;
  const totalPages = Math.ceil(activeArticles.length / ARTICLES_PER_PAGE);
  const paginatedArticles = activeArticles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE
  );

  // Reset page when source changes
  const handleSourceClick = (source: string) => {
    setSelectedOutlet(source);
    setCurrentPage(1);
  };

  return (
    <section className={cn("py-8 animate-fade-in", className)}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="bg-primary w-1.5 h-6 rounded-full inline-block"></span>
          언론사별 뉴스
        </h2>
      </div>

      {/* Media Outlet Selector (Horizontal Scroll) */}
      <div className="relative mb-8 group">
        <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar snap-x">
          {topSources.map((source) => {
            const faviconUrl = articlesBySource[source][0]?.favicon_url || "";
            const isActive = activeSource === source;

            return (
              <button
                key={source}
                onClick={() => handleSourceClick(source)}
                className={cn(
                  "snap-start shrink-0 pl-1.5 pr-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border flex items-center gap-2",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/20"
                    : "bg-card text-muted-foreground border-border/60 hover:border-primary/50 hover:bg-accent hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full overflow-hidden",
                    isActive ? "bg-white/20" : "bg-muted/50"
                  )}
                >
                  <Favicon src={faviconUrl} alt={source} size={14} />
                </div>
                <span>{source}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full ml-0.5",
                    isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  )}
                >
                  {articlesBySource[source].length}
                </span>
              </button>
            );
          })}
        </div>
        {/* Fade effect on right */}
        <div className="absolute right-0 top-0 bottom-4 w-12 bg-linear-to-l from-background to-transparent pointer-events-none md:hidden" />
      </div>

      {/* Articles Grid for Selected Outlet */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[400px]">
        {paginatedArticles.map((article) => (
          <ArticleCard key={article.id} article={article} variant="standard" className="h-full" />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-8 border-t border-border mt-8">
          <ClientPaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </section>
  );
}
