"use client";

import { Article } from "@/lib/types/article";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ArticleEmbedCardProps {
  article: Article;
  className?: string;
}

export default function ArticleEmbedCard({ article, className }: ArticleEmbedCardProps) {
  return (
    <Link
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group block relative w-full h-full min-h-[100px] rounded-xl overflow-hidden border border-border bg-card transition-all hover:shadow-md hover:border-primary/50",
        className
      )}
    >
      <div className="flex flex-row h-full">
        {/* Image Section */}
        <div className="relative w-1/3 min-w-[100px] max-w-[140px] shrink-0">
          <Image
            src={article.thumbnail_url || "/placeholder.png"}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        </div>

        {/* Content Section */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {article.source}
              </span>
              <span className="text-[10px] text-muted-foreground/80">뉴스</span>
            </div>

            <h3 className="text-sm font-bold leading-tight line-clamp-2 text-foreground mb-1">{article.title}</h3>

            {article.summary && <p className="text-xs text-muted-foreground line-clamp-1">{article.summary}</p>}
          </div>

          <div className="flex items-center justify-end mt-2">
            <span className="text-[10px] text-primary flex items-center gap-1 font-medium group-hover:underline">
              기사 보기 <ExternalLink size={10} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
