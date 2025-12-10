'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { incrementTopicView } from '@/lib/api';

interface TopicViewCounterProps {
  topicId: string;
}

export default function TopicViewCounter({ topicId }: TopicViewCounterProps) {
  const router = useRouter();
  const incrementedTopics = useRef(new Set<string>());

  useEffect(() => {
    const handleViewIncrement = async () => {
      if (topicId && !incrementedTopics.current.has(topicId)) {
        incrementedTopics.current.add(topicId);
        try {
          await incrementTopicView(topicId);
          router.refresh();
        } catch (error) {
          console.error('Failed to increment view count or refresh page:', error);
          incrementedTopics.current.delete(topicId);
        }
      }
    };

    handleViewIncrement();
  }, [topicId, router]);

  return null;
}
