'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Topic } from "@/lib/types/topic";
import { getAllTopics } from '@/lib/api/topics';
import { formatRelativeTime } from '@/lib/utils';

interface RelatedTopicsCarouselProps {
  currentTopicId: string;
}

export default function RelatedTopicsCarousel({ currentTopicId }: RelatedTopicsCarouselProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedTopics = await getAllTopics();
        // Filter out the current topic and ensure we have enough topics to loop
        const relatedTopics = fetchedTopics.filter(topic => topic.id.toString() !== currentTopicId);
        // Duplicate the array to create a seamless loop
        setTopics([...relatedTopics, ...relatedTopics]);
      } catch (err) {
        setError("관련 토픽을 불러오는 데 실패했습니다.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopics();
  }, [currentTopicId]);

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-5">관련 토픽 로딩 중...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-5">{error}</div>;
  }

  if (topics.length === 0) {
    return null; // Don't render if no related topics
  }

  return (
    <div className="mt-16 relative">
      <h3 className="text-2xl font-bold text-white mb-6 text-center">다른 토론 주제 둘러보기</h3>
      <div className="scroller w-full overflow-hidden">
        <div className="scroller-inner flex gap-6 w-max animate-scroll hover:[animation-play-state:paused]">
          {topics.map((topic, index) => (
            <Link href={`/debate/${topic.id}`} key={`${topic.id}-${index}`} className="flex-none w-80 group">
              <div className="bg-card/50 border border-border rounded-2xl p-6 h-full transition-all duration-300 ease-in-out group-hover:bg-card group-hover:border-red-500/50 group-hover:-translate-y-2">
                <h4 className="text-lg font-bold text-white truncate mb-2">{topic.display_name}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2 h-10">{topic.summary}</p>
                <div className="flex justify-between items-center text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                  <span>조회수 {topic.view_count}</span>
                  <time dateTime={topic.published_at}>{formatRelativeTime(topic.published_at)}</time>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}