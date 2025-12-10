'use client';

import ArticleCard from './ArticleCard';
import { Article } from '@/lib/types/article';

interface CategoryNewsSectionProps {
  categoryName: string;
  articles: Article[];
}

export default function CategoryNewsSection({ categoryName, articles }: CategoryNewsSectionProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {articles.length > 0 ? (
        articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))
      ) : (
        <p className="text-zinc-500 sm:col-span-2 md:col-span-3 lg:col-span-5 text-center py-5">
          표시할 {categoryName} 뉴스가 없습니다.
        </p>
      )}
    </div>
  );
}
