'use client';

import { useState, useEffect, useCallback } from 'react';
import ArticleCard from './ArticleCard';
import LoadingSpinner from './common/LoadingSpinner';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { Article } from '@/lib/types/article';
import { getBreakingNews } from '@/lib/api/articles';

const BreakingNews = () => {
  const { token } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBreakingNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Pass token only if user is logged in
      const fetchedArticles = await getBreakingNews(token || undefined);
      setArticles(fetchedArticles);
    } catch (err) {
      setError('속보를 불러오는 데 실패했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBreakingNews();
  }, [fetchBreakingNews]);

  if (isLoading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-48 flex flex-col items-center justify-center text-red-500 bg-red-500/10 rounded-lg">
        <AlertTriangle className="w-8 h-8 mb-2" />
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return null; // Don't render anything if there are no articles
  }

  return (
    <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 px-4 md:px-0">주요 <span className="text-red-500">속보</span></h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {articles.map((article) => (
                <ArticleCard key={article.id} article={article} variant="compact" />
            ))}
        </div>
    </section>
  );
};

export default BreakingNews;
