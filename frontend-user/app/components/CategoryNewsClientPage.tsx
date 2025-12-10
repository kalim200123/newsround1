"use client";

import { getCategoryTheme } from "@/lib/categoryColors";

import { useAuth } from "@/app/context/AuthContext";
import { getCategoryNews, toggleArticleSave } from "@/lib/api";
import { ARTICLES_PER_PAGE } from "@/lib/constants/category";
import { Article } from "@/lib/types/article";
import { Newspaper } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import CategoryArticleGrid from "./category/CategoryArticleGrid";
import CategorySourceSidebar from "./category/CategorySourceSidebar";
import ClientPaginationControls from "./common/ClientPaginationControls";
import { EmptyState } from "./common/EmptyState";
import LoadingSpinner from "./common/LoadingSpinner";

interface CategoryNewsClientPageProps {
  categoryName: string;
}

export default function CategoryNewsClientPage({ categoryName }: CategoryNewsClientPageProps) {
  const { token } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSource, setSelectedSource] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);

  const theme = getCategoryTheme(categoryName);

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedArticles = await getCategoryNews(categoryName, 100, token || undefined);
      setArticles(fetchedArticles);
    } catch (err) {
      setError("뉴스를 불러오는 데 실패했습니다.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [categoryName, token]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleSaveToggle = async (articleToToggle: Article) => {
    if (!token) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    const originalArticles = articles;
    const newArticles = articles.map((a) => (a.id === articleToToggle.id ? { ...a, isSaved: !a.isSaved } : a));
    setArticles(newArticles);

    try {
      await toggleArticleSave(token, articleToToggle.id, !!articleToToggle.isSaved, "home");
    } catch (err) {
      setArticles(originalArticles);
      alert("기사 저장 상태 변경에 실패했습니다.");
      console.error(err);
    }
  };

  const sources = useMemo(() => {
    const allSources = articles.map((article) => article.source);
    return ["전체", ...Array.from(new Set(allSources))];
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return selectedSource === "전체" ? articles : articles.filter((article) => article.source === selectedSource);
  }, [articles, selectedSource]);

  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  const paginatedArticles = useMemo(() => {
    const indexOfLastArticle = currentPage * ARTICLES_PER_PAGE;
    const indexOfFirstArticle = indexOfLastArticle - ARTICLES_PER_PAGE;
    return filteredArticles.slice(indexOfFirstArticle, indexOfLastArticle);
  }, [filteredArticles, currentPage]);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
      <header className="mb-8">
        <h1 className={`text-5xl font-extrabold text-foreground border-b-4 ${theme.border} pb-4 inline-block`}>
          {categoryName}
        </h1>
      </header>

      {/* Main content area: Sidebar + Article Grid */}
      <div className="flex flex-col lg:flex-row gap-6">
        {" "}
        {/* Use flexbox for layout */}
        {/* Left Sidebar */}
        <CategorySourceSidebar
          sources={sources}
          selectedSource={selectedSource}
          setSelectedSource={setSelectedSource}
          setCurrentPage={setCurrentPage}
          categoryTheme={theme}
        />
        {/* Main Article Content */}
        <div className="grow">
          {" "}
          {/* This div will contain the article grid and pagination */}
          {isLoading ? (
            <div className="h-96 flex items-center justify-center">
              <LoadingSpinner size="large" />
            </div>
          ) : error ? (
            <div className="h-96 flex items-center justify-center">
              <EmptyState Icon={Newspaper} title="오류 발생" description="뉴스를 불러오는 데 실패했습니다." />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="py-20">
              <EmptyState Icon={Newspaper} title="기사 없음" description="해당 언론사의 뉴스가 없습니다." />
            </div>
          ) : (
            <div className="space-y-12">
              <CategoryArticleGrid
                articles={paginatedArticles}
                token={token}
                handleSaveToggle={handleSaveToggle}
                categoryTheme={theme}
              />
              {totalPages > 1 && (
                <ClientPaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
