'use client';

import { useState, useEffect, useCallback } from 'react';
import { getExclusiveNews } from '@/lib/api/articles';
import { Article } from '@/lib/types/article';
import ArticleCard from './ArticleCard';
import LoadingSpinner from './common/LoadingSpinner';
import { AlertTriangle } from 'lucide-react';

const ExclusiveNews = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExclusiveNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedArticles = await getExclusiveNews();
      setArticles(fetchedArticles.slice(0, 5)); // Get only 5 articles
    } catch (err) {
      setError('단독 기사를 불러오는 데 실패했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExclusiveNews();
  }, [fetchExclusiveNews]);

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
    return (
        <div className="w-full h-48 flex flex-col items-center justify-center text-gray-500 bg-gray-500/10 rounded-lg">
            <p className="font-semibold">단독 기사가 없습니다.</p>
      </div>
    );
  }

  return (
    <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 px-4 md:px-0"><span className="text-blue-500">단독</span> 기사</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {articles.map((article) => (
                <ArticleCard key={article.id} article={article} variant="compact" />
            ))}
        </div>
    </section>
  );
};

export default ExclusiveNews;
