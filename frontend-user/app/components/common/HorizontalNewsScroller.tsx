'use client';

import React from 'react';
import Link from 'next/link';
// 1번에서 만든 StyledArticleTitle 컴포넌트를 import합니다.
import StyledArticleTitle from "@/app/components/common/StyledArticleTitle"; 
import { Article } from '@/lib/types/article'; // 'news' 프로젝트의 Article 타입을 사용합니다.

interface HorizontalNewsScrollerProps {
  news: Article[];
}

const HorizontalNewsScroller: React.FC<HorizontalNewsScrollerProps> = ({ news }) => {
  if (!news || news.length === 0) {
    return null;
  }

  // 애니메이션을 부드럽게 이어가기 위해 데이터를 복제합니다.
  const duplicatedNews = [...news, ...news, ...news, ...news];

  return (
    <>
      <div className="flex items-center" style={{ animation: 'marquee 60s linear infinite' }}>
        {duplicatedNews.map((article, index) => (
          <Link
            key={`${article.id}-${index}`}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 truncate max-w-md text-sm text-neutral-300 hover:text-white px-6"
            title={article.title}
          >
            {/* StyledArticleTitle을 사용하여 [속보], [단독] 색상 적용 */}
            <StyledArticleTitle title={article.title} disableTooltip={true} />
          </Link>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        /* 마우스 호버 시 애니메이션 멈춤 */
        .flex:hover {
          animation-play-state: paused;
        }
      `}</style>
    </>
  );
};

export default HorizontalNewsScroller;