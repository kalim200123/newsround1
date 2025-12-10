"use client";

import { getCategoryNews } from "@/lib/api/articles"; // Import getCategoryNews
import { DEFAULT_FAVICON_URL, FAVICON_URLS } from "@/lib/constants";
import { Article } from "@/lib/types/article";
import { formatRelativeTime } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ClientPaginationControls from "./common/ClientPaginationControls";
import Favicon from "./common/Favicon"; // Import Favicon
import LoadingSpinner from "./common/LoadingSpinner";

const ARTICLES_PER_PAGE = 20;

export default function CategoryNewsList({ categoryName, className }: { categoryName: string; className?: string }) {
  const [newsList, setNewsList] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadArticles() {
      setIsLoading(true);
      // Use the standardized getCategoryNews function
      const articles = await getCategoryNews(categoryName); // Fetch all articles
      setNewsList(articles);
      setIsLoading(false);
    }
    loadArticles();
  }, [categoryName]);

  const sources = useMemo(() => {
    const sourceSet = new Set(newsList.map((news) => news.source));
    return ["all", ...Array.from(sourceSet)];
  }, [newsList]);

  const filteredNews = useMemo(() => {
    if (selectedSource === "all") {
      return newsList;
    }
    return newsList.filter((news) => news.source === selectedSource);
  }, [newsList, selectedSource]);

  const totalPages = Math.ceil(filteredNews.length / ARTICLES_PER_PAGE);

  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
    const endIndex = startIndex + ARTICLES_PER_PAGE;
    return filteredNews.slice(startIndex, endIndex);
  }, [filteredNews, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className={`bg-card p-4 rounded-lg ${className}`}>
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-700">
        <h2 className="text-2xl font-bold text-white">{categoryName}</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {sources.map((source) => (
              <button
                key={source}
                onClick={() => {
                  setSelectedSource(source);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${
                  selectedSource === source ? "bg-red-600 text-white" : "bg-muted text-foreground hover:bg-muted"
                }`}
              >
                {source === "all" ? "전체" : source}
              </button>
            ))}
          </div>

          <div className="space-y-6 min-h-[500px]">
            {paginatedArticles.length > 0 ? (
              paginatedArticles.map((news) => {
                const faviconUrl =
                  FAVICON_URLS[news.source_domain || ""] || DEFAULT_FAVICON_URL(news.source_domain || "");

                return (
                  <article key={news.id} className="flex flex-col md:flex-row gap-4 group">
                    <div className="relative w-full md:w-48 h-32 bg-muted rounded-md shrink-0 overflow-hidden">
                      {news.thumbnail_url && (
                        <Image
                          src={news.thumbnail_url}
                          alt={`${news.title} 썸네일`}
                          fill
                          sizes="(max-width: 768px) 100vw, 192px"
                          style={{ objectFit: "cover" }}
                          className="rounded-md transition-opacity duration-300 group-hover:opacity-80"
                          unoptimized={true}
                        />
                      )}
                    </div>

                    <div className="flex flex-col flex-1">
                      <Link href={news.url} target="_blank" rel="noopener noreferrer">
                        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:underline">
                          {news.title}
                        </h3>
                      </Link>
                      <div className="flex items-center text-xs text-muted-foreground mt-auto pt-2">
                        {faviconUrl && (
                          <Favicon
                            src={faviconUrl}
                            alt={`${news.source} 파비콘`}
                            size={16}
                            className="mr-1.5 rounded"
                          />
                        )}
                        <span>{news.source}</span>
                        <span className="mx-1.5">·</span>
                        <time dateTime={news.published_at}>{formatRelativeTime(news.published_at)}</time>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="text-muted-foreground text-center py-10">
                {selectedSource === "all"
                  ? "해당 카테고리에 뉴스가 없습니다."
                  : `'${selectedSource}' 출처의 뉴스가 없습니다.`}
              </p>
            )}
          </div>

          {totalPages > 1 && (
            <ClientPaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </section>
  );
}
