'use client';

import { useState } from 'react';
import { Article } from '@/lib/types/article';
import Image from 'next/image';
import Link from 'next/link';

interface InteractiveNewsCarouselProps {
  articles: Article[];
}

export default function InteractiveNewsCarousel({ articles }: InteractiveNewsCarouselProps) {
  const [featuredArticle, setFeaturedArticle] = useState<Article | null>(articles && articles.length > 0 ? articles[0] : null);

  if (!articles || articles.length === 0) {
    return null;
  }

  const sideArticles = articles.slice(1, 5);

  return (
    <div className="relative w-full h-[450px] rounded-2xl overflow-hidden group">
      {/* Background Image */}
      <div className="absolute inset-0 transition-all duration-500 ease-in-out">
        {featuredArticle && (
          <Image
            src={featuredArticle.thumbnail_url || '/placeholder.png'}
            alt="Background"
            fill
            className="object-cover scale-110 blur-lg brightness-50"
          />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>

      <div className="relative z-10 flex h-full">
        {/* Featured Article Section */}
        <div className="w-3/5 p-8 flex flex-col justify-end">
          {featuredArticle && (
            <div className="transition-opacity duration-500">
              <h2 className="text-4xl font-extrabold text-white leading-tight shadow-lg mb-4">
                <Link href={`/article/${featuredArticle.id}`} className="hover:underline">
                  {featuredArticle.title}
                </Link>
              </h2>
              <p className="text-foreground line-clamp-3 shadow-md">{featuredArticle.summary}</p>
            </div>
          )}
        </div>

        {/* Side List Section */}
        <div className="w-2/5 p-8 bg-black/30 backdrop-blur-sm border-l border-white/10">
          <div className="h-full flex flex-col justify-center space-y-4">
            {sideArticles.map((article) => (
              <div
                key={article.id}
                onMouseEnter={() => setFeaturedArticle(article)}
                className={`p-3 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-4 ${
                  featuredArticle?.id === article.id ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <Image
                  src={article.thumbnail_url || '/placeholder.png'}
                  alt={article.title}
                  width={100}
                  height={56}
                  className="rounded-md object-cover w-24 h-14 flex-shrink-0"
                />
                <div className="overflow-hidden">
                  <h3 className="text-sm font-bold text-white truncate">{article.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{article.source}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
