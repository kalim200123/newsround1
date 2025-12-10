'use client';

import { getCategoryTheme } from '@/lib/categoryColors';
import { Article } from '@/lib/types/article';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

interface LivingNewsWallProps {
  articles: Article[];
  category: string;
  icon: React.ReactNode;
  href: string;
}

export default function LivingNewsWall({ articles, category, icon, href }: LivingNewsWallProps) {
  const [hoveredId, setHoveredId] = useState<number | string | null>(null);
  const [animatedItems, setAnimatedItems] = useState<Set<number | string>>(new Set());
  
  const theme = getCategoryTheme(category);

  const allItems = useMemo(() => [
    { id: `header-${category}`, type: 'header' },
    ...articles.slice(0, 10).map(article => ({ id: article.id, type: 'article' }))
  ], [articles, category]);

  useEffect(() => {
    if (articles.length > 0) {
      const timers = allItems.map((item, index) => 
        setTimeout(() => {
          setAnimatedItems(prev => new Set(prev).add(item.id));
        }, index * 80)
      );
      return () => timers.forEach(clearTimeout);
    }
  }, [articles.length, allItems]);

  if (!articles || articles.length === 0) {
    return (
      <div className="relative w-full my-8">
        <div className={`absolute inset-0 rounded-3xl ${theme.wallBg}`}></div>
        <div className="relative flex flex-col items-center justify-center h-[450px] p-4 text-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/20">
              {icon}
            </div>
            <h2 className="text-xl font-bold text-foreground">{category}</h2>
          </div>
          <p className="text-muted-foreground">이 카테고리에는 현재 기사가 없습니다.</p>
          <Link href={href} className="mt-4 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            더보기 <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  const featuredArticle = articles[0];
  const gridArticles = articles.slice(1, 6);
  const thirdRowArticles = articles.slice(6, 10);

  const getGridPosition = (index: number) => {
    if (index === 0) return { r: 0, c: 0 };
    if (index === 1) return { r: 0, c: 1 };
    if (index >= 2 && index <= 3) return { r: 0, c: index + 1 };
    if (index >= 4 && index <= 5) return { r: 1, c: index - 2 };
    if (index >= 6) return { r: 2, c: index - 6 };
    return { r: 0, c: 0 };
  };

  const getRippleStyle = (currentItemId: string | number, myIndex: number): React.CSSProperties => {
    if (hoveredId === null || hoveredId === currentItemId) return {};
    const hoveredIndex = allItems.findIndex(item => item.id === hoveredId);
    if (hoveredIndex === -1) return {};

    const myPos = getGridPosition(myIndex);
    const hoveredPos = getGridPosition(hoveredIndex);

    const pushStrength = 8;
    let dx = 0, dy = 0;
    if (myPos.c > hoveredPos.c) dx = pushStrength;
    if (myPos.c < hoveredPos.c) dx = -pushStrength;
    if (myPos.r > hoveredPos.r) dy = pushStrength;
    if (myPos.r < hoveredPos.r) dy = -pushStrength;

    return {
      transform: `translate(${dx}px, ${dy}px) scale(0.98)`,
      transition: 'transform 0.3s ease-out',
    };
  };

  const getSafeUrl = (article: Article) => {
    if (article.url && article.url.startsWith('http')) return article.url;
    if (article.source_domain && article.url) return `https://${article.source_domain}${article.url.startsWith('/') ? article.url : '/' + article.url}`;
    return '#';
  };

  return (
    <div className="relative w-full my-8">
      <div className={`absolute inset-0 rounded-3xl ${theme.wallBg}`}></div>
      <div className="relative grid grid-cols-4 grid-rows-2 gap-2 h-[450px] p-4">
        {/* Holo-Header */}
        <div
          onMouseEnter={() => setHoveredId(`header-${category}`)}
          onMouseLeave={() => setHoveredId(null)}
          className={`relative rounded-lg p-4 flex flex-col justify-between items-start backdrop-blur-md transition-all duration-500 ${theme.holoBg} ${animatedItems.has(`header-${category}`) ? 'opacity-100' : 'opacity-0'}`}
          style={{ ...getRippleStyle(`header-${category}`, 0), animationName: animatedItems.has(`header-${category}`) ? 'article-enter' : 'none' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/20">
              {icon}
            </div>
            <h2 className="text-xl font-bold text-foreground">{category}</h2>
          </div>
          <Link href={href} className="self-end text-muted-foreground hover:text-foreground transition-colors">
            <ArrowRight size={20} />
          </Link>
        </div>

        {/* Featured Article */}
        <div
          onMouseEnter={() => setHoveredId(featuredArticle.id)}
          onMouseLeave={() => setHoveredId(null)}
          className={`col-span-2 row-span-2 relative rounded-lg overflow-hidden group transition-all duration-500 ${animatedItems.has(featuredArticle.id) ? 'opacity-100' : 'opacity-0'}`}
          style={{ ...getRippleStyle(featuredArticle.id, 1), animationDelay: '80ms', animationName: animatedItems.has(featuredArticle.id) ? 'article-enter' : 'none' }}
        >
          <Link href={getSafeUrl(featuredArticle)} target="_blank" rel="noopener noreferrer">
            <Image src={featuredArticle.thumbnail_url} alt={featuredArticle.title} fill className={`object-cover transition-all duration-300 ease-in-out ${hoveredId === featuredArticle.id ? 'scale-105 brightness-100' : 'scale-100 brightness-75'}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            <div className="absolute bottom-0 p-6 text-white">
              <h3 className="text-2xl font-bold">{featuredArticle.title}</h3>
            </div>
            <div className={`absolute inset-0 border-2 rounded-lg transition-all duration-300 ${hoveredId === featuredArticle.id ? theme.border : 'border-transparent'}`}></div>
          </Link>
        </div>

        {/* Grid Articles */}
        {gridArticles.map((article, index) => (
          <div
            key={article.id}
            onMouseEnter={() => setHoveredId(article.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`relative rounded-lg overflow-hidden group transition-all duration-500 ${animatedItems.has(article.id) ? 'opacity-100' : 'opacity-0'}`}
            style={{ ...getRippleStyle(article.id, index + 2), animationDelay: `${(index + 2) * 80}ms`, animationName: animatedItems.has(article.id) ? 'article-enter' : 'none' }}
          >
            <Link href={getSafeUrl(article)} target="_blank" rel="noopener noreferrer">
              <Image src={article.thumbnail_url} alt={article.title} fill className={`object-cover transition-all duration-300 ease-in-out ${hoveredId === article.id ? 'scale-105 brightness-100' : 'scale-100 brightness-75'}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-0 p-3 text-white">
                <h4 className="text-sm font-semibold line-clamp-2">{article.title}</h4>
              </div>
              <div className={`absolute inset-0 border-2 rounded-lg transition-all duration-300 ${hoveredId === article.id ? theme.border : 'border-transparent'}`}></div>
            </Link>
          </div>
        ))}
      </div>
      {/* Third Row */}
      <div className="relative grid grid-cols-4 gap-2 px-4 pb-4">
        {thirdRowArticles.map((article, index) => (
          <div
            key={article.id}
            onMouseEnter={() => setHoveredId(article.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`relative rounded-lg overflow-hidden group h-48 transition-all duration-500 ${animatedItems.has(article.id) ? 'opacity-100' : 'opacity-0'}`}
            style={{ ...getRippleStyle(article.id, index + 6), animationDelay: `${(index + 6) * 80}ms`, animationName: animatedItems.has(article.id) ? 'article-enter' : 'none' }}
          >
            <Link href={getSafeUrl(article)} target="_blank" rel="noopener noreferrer">
              <Image src={article.thumbnail_url} alt={article.title} fill className="object-cover brightness-75 group-hover:brightness-100 transition-all" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <h5 className="absolute bottom-0 p-2 text-xs font-bold text-white line-clamp-2">{article.title}</h5>
              <div className={`absolute inset-0 border-2 rounded-lg transition-all duration-300 ${hoveredId === article.id ? theme.border : 'border-transparent'}`}></div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}