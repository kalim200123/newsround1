"use client";

import { Article } from "@/lib/types/article";
import { formatRelativeTime } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import ArticleImageWithFallback from "../ArticleImageWithFallback";
import Favicon from "../common/Favicon"; // Import Favicon
import StyledArticleTitle from "../common/StyledArticleTitle";

interface SearchResultCardProps {
  article: Article;
  index: number;
}

export default function SearchResultCard({ article, index }: SearchResultCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="w-full"
    >
      <Link
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-card/50 rounded-xl overflow-hidden group hover:bg-card transition-colors duration-300 h-full"
      >
        <div className="relative w-full h-40">
          <ArticleImageWithFallback
            src={article.thumbnail_url}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
        </div>
        <div className="p-4 flex flex-col h-full">
          <StyledArticleTitle title={article.title} className="text-md font-bold text-white mb-2 line-clamp-2" />
          <p className="text-muted-foreground text-sm line-clamp-2 grow">{article.description}</p>
          <div className="flex items-center text-xs text-muted-foreground mt-3">
            {article.favicon_url && (
              <Favicon src={article.favicon_url} alt={article.source} size={12} className="mr-1.5 rounded-sm" />
            )}
            <span className="truncate max-w-[100px]">{article.source}</span>
            <span className="mx-1.5">·</span>
            <span>{formatRelativeTime(article.published_at)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
