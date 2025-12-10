"use client";

import { Article } from "@/lib/types/article";
import { ArrowRight, Trophy } from "lucide-react";
import Link from "next/link";
import ArticleCard from "../ArticleCard";

interface SportsSectionProps {
  articles: Article[];
}

export default function SportsSection({ articles }: SportsSectionProps) {
  if (!articles || articles.length === 0) return null;

  return (
    <section className="py-8 border-y border-border bg-secondary -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-black italic tracking-tighter text-foreground flex items-center gap-2 uppercase">
            <Trophy className="text-orange-600" />
            Sports
          </h2>
          <Link
            href="/sports"
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-orange-600 transition-colors"
          >
            더보기 <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Main Highlight */}
          <div className="lg:col-span-2">
            {articles[0] && <ArticleCard article={articles[0]} variant="hero" customHoverColor="blue" />}
          </div>

          {/* Side List */}
          <div className="flex flex-col gap-4">
            {articles.slice(1, 4).map((article) => (
              <ArticleCard key={article.id} article={article} variant="horizontal" customHoverColor="blue" />
            ))}
          </div>

          {/* Bottom Row */}
          {articles.slice(4, 7).map((article) => (
            <div key={article.id} className="lg:col-span-1">
              <ArticleCard article={article} variant="standard" customHoverColor="blue" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
