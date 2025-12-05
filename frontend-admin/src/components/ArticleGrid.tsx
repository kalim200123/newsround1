import { useEffect, useMemo, useState } from "react";
import type { Article } from "../types";
import ArticleCard from "./ArticleCard";
import Pagination from "./Pagination";

interface ArticleGridProps {
  side: "진보" | "보수";
  featuredArticle?: Article;
  regularArticles: Article[];
}

const ARTICLES_PER_PAGE = 3;

const ArticleGrid = ({ side, featuredArticle, regularArticles }: ArticleGridProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [regularArticles.length]);

  const { paginatedArticles, totalPages } = useMemo(() => {
    const total = Math.ceil(regularArticles.length / ARTICLES_PER_PAGE);
    const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
    const sliced = regularArticles.slice(startIndex, startIndex + ARTICLES_PER_PAGE);
    return {
      paginatedArticles: sliced,
      totalPages: total,
    };
  }, [currentPage, regularArticles]);

  const totalCount = regularArticles.length + (featuredArticle ? 1 : 0);
  const hasRegularArticles = regularArticles.length > 0;

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="article-column">
      <h2>
        {side}
        <small>총 {totalCount}개</small>
      </h2>
      <div className="article-list-wrapper">
        {featuredArticle && <ArticleCard article={featuredArticle} isFeatured />}

        <div className="regular-article-list">
          {hasRegularArticles ? (
            paginatedArticles.map((article) => <ArticleCard key={article.id} article={article} />)
          ) : (
            <p className="article-empty-message">추가 기사가 아직 준비되지 않았습니다.</p>
          )}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>
    </div>
  );
};

export default ArticleGrid;
