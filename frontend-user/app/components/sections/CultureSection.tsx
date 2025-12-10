"use client";

import { Article } from "@/lib/types/article";
import { ArrowRight, Palette } from "lucide-react";
import Link from "next/link";
import ArticleCard from "../ArticleCard";

interface CultureSectionProps {
  articles: Article[];
}

export default function CultureSection({ articles }: CultureSectionProps) {
  if (!articles || articles.length === 0) return null;

  return (
    <section className="py-12 border-y border-border bg-secondary -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold font-serif italic tracking-tight text-foreground flex items-center gap-2">
            <Palette className="text-purple-600" />
            문화
          </h2>
          <Link
            href="/culture"
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-purple-600 transition-colors"
          >
            더보기 <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[300px]">
          {/* First item: Large 2x2 */}
          {articles[0] && (
            <div className="md:col-span-2 md:row-span-2">
              <ArticleCard article={articles[0]} variant="overlay" className="h-full" />
            </div>
          )}

          {/* Next 4 items: Standard 1x1 */}
          {articles.slice(1, 5).map((article) => (
            <div key={article.id} className="col-span-1 row-span-1">
              <ArticleCard article={article} variant="overlay" className="h-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
