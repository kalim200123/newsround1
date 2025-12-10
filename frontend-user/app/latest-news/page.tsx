'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { getCategoryNews, toggleArticleSave } from '@/lib/api';
import { Article } from '@/lib/types/article';
import ArticleCard from '@/app/components/ArticleCard';
import { Newspaper } from 'lucide-react';
import ClientPaginationControls from '@/app/components/common/ClientPaginationControls';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ARTICLES_PER_PAGE = 20;

async function fetchAllLatestNews(token?: string) {
  const categories = ["정치", "경제", "사회", "문화"];
  // Fetch 100 articles per category to ensure a large pool
  const newsPromises = categories.map(category => 
    getCategoryNews(category, 100, token).catch(err => {
      console.error(`Error fetching latest news for category ${category}:`, err);
      return [];
    })
  );

  const results = await Promise.all(newsPromises);
  const allArticles = results.flat();
  
  const uniqueArticlesMap = new Map<number, Article>();
  allArticles.forEach((article) => {
    uniqueArticlesMap.set(article.id, article);
  });

  const sortedArticles = Array.from(uniqueArticlesMap.values())
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

  // Return the top 100 unique articles
  return sortedArticles.slice(0, 100);
}

export default function LatestNewsPage() {
  const { token } = useAuth();
  const isLoggedIn = !!token;
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let ignore = false;

    async function fetchNews() {
      setIsLoading(true);
      const articles = await fetchAllLatestNews(isLoggedIn ? token : undefined);
      if (!ignore) {
        setAllArticles(articles);
        setIsLoading(false);
      }
    }

    fetchNews();

    return () => {
      ignore = true;
    };
  }, [token, isLoggedIn]);

  const totalPages = Math.ceil(allArticles.length / ARTICLES_PER_PAGE);

  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
    const endIndex = startIndex + ARTICLES_PER_PAGE;
    return allArticles.slice(startIndex, endIndex);
  }, [allArticles, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleSaveToggle = async (articleToToggle: Article) => {
    if (!isLoggedIn || !token) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }

    const originalArticles = allArticles;
    const newArticles = allArticles.map((a) =>
      a.id === articleToToggle.id ? { ...a, isSaved: !a.isSaved } : a
    );
    setAllArticles(newArticles);

    try {
      await toggleArticleSave(token, articleToToggle.id, !!articleToToggle.isSaved, "home");
    } catch (err) {
      // Revert on error
      setAllArticles(originalArticles);
      alert('기사 저장 상태 변경에 실패했습니다. 다시 시도해주세요.');
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-screen-2xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="bg-card p-4 lg:p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-700">
          <Newspaper className="w-6 h-6 text-white" />
          <h2 className="text-lg lg:text-xl font-bold text-white">최신 뉴스</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <LoadingSpinner />
          </div>
        ) : paginatedArticles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedArticles.map(article => (
                <ArticleCard 
                  key={article.id} 
                  article={article} 
                  onSaveToggle={isLoggedIn ? handleSaveToggle : undefined}
                />
              ))}
            </div>
            <ClientPaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <p className="text-center text-muted-foreground">최신 뉴스가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
