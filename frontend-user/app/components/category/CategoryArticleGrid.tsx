"use client";

import React from 'react';
import { Article } from "@/lib/types/article";
import CategoryArticleCard from "./CategoryArticleCard";
import { getCategoryTheme } from "@/lib/categoryColors"; // Assuming this is needed for categoryTheme prop
import { cn } from "@/lib/utils"; // Assuming cn utility is used for class concatenation

interface CategoryArticleGridProps {
  articles: Article[];
  token: string | null;
  handleSaveToggle: (article: Article) => void;
  categoryTheme: ReturnType<typeof getCategoryTheme>;
}

// Define the type for the layout object returned by getArticleLayout
type ArticleLayout = {
  variant: "hero" | "standard" | "compact" | "horizontal" | "title-only";
  colSpan: string;
  rowSpan: string;
};

export default function CategoryArticleGrid({
  articles,
  token,
  handleSaveToggle,
  categoryTheme,
}: CategoryArticleGridProps) {

  // Explicitly type the return value of getArticleLayout
  const getArticleLayout = (): ArticleLayout => {
    // For a uniform layout, all articles will be 'standard' and occupy a single column
    // The grid container will define overall responsiveness
    return { variant: "standard", colSpan: "col-span-full md:col-span-1", rowSpan: "" };
  };

  return (
    // Adjust grid classes for uniform standard cards
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {articles.map((article) => {
        const { variant, colSpan, rowSpan } = getArticleLayout();
        return (
          <div key={article.id} className={cn(colSpan, rowSpan)}>
            <CategoryArticleCard
              article={article}
              variant={variant}
              handleSaveToggle={handleSaveToggle}
              categoryTheme={categoryTheme}
            />
          </div>
        );
      })}
    </div>
  );
}
