"use client";

import { Article } from "@/lib/types/article";
import ArticleCard from "./ArticleCard";

interface SectionGridProps {
  articles: Article[];
  variant?: "1+4" | "3-col" | "4-col" | "1+2" | "list";
  className?: string;
  title?: string;
  onSaveToggle?: (article: Article) => void;
  onCommentIconClick?: (article: Article) => void;
}

export default function SectionGrid({
  articles,
  variant = "3-col",
  className = "",
  title,
  onSaveToggle,
  onCommentIconClick,
}: SectionGridProps) {
  if (!articles || articles.length === 0) return null;

  const commonProps = {
    onSaveToggle,
    onCommentIconClick,
  };

  return (
    <div className={`w-full ${className}`}>
      {title && <h2 className="text-2xl font-bold mb-6 border-l-4 border-black dark:border-white pl-4">{title}</h2>}

      {/* Variant: 1 Main + 4 Side List (Classic News) */}
      {variant === "1+4" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 overflow-hidden">
          <div className="lg:col-span-2">
            {articles[0] && <ArticleCard article={articles[0]} variant="hero" {...commonProps} />}
          </div>
          <div className="flex flex-col gap-2">
            {articles.slice(1, 5).map((article) => (
              <ArticleCard key={article.id} article={article} variant="horizontal" hideImage={false} {...commonProps} />
            ))}
          </div>
        </div>
      )}

      {/* Variant: 1 Main + 2 Side (Standard) */}
      {variant === "1+2" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="">{articles[0] && <ArticleCard article={articles[0]} variant="hero" {...commonProps} />}</div>
          <div className="flex flex-col gap-6">
            {articles.slice(1, 3).map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant="horizontal"
                className="h-full"
                {...commonProps}
              />
            ))}
          </div>
        </div>
      )}

      {/* Variant: 3 Columns (Standard Grid) */}
      {variant === "3-col" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} variant="standard" {...commonProps} />
          ))}
        </div>
      )}

      {/* Variant: 4 Columns (Compact Grid) */}
      {variant === "4-col" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} variant="standard" {...commonProps} />
          ))}
        </div>
      )}

      {/* Variant: List (Vertical Stack) */}
      {variant === "list" && (
        <div className="flex flex-col gap-4">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} variant="horizontal" {...commonProps} />
          ))}
        </div>
      )}
    </div>
  );
}
