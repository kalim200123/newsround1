"use client";

import { Topic } from '@/lib/types/topic';
import RelatedTopicCard from './RelatedTopicCard';

interface RelatedTopicsSectionProps {
  topics: Topic[];
}

export default function RelatedTopicsSection({ topics }: RelatedTopicsSectionProps) {
  if (!topics || topics.length === 0) {
    return null;
  }

  return (
    <div className="my-10">
      <h3 className="text-xl font-bold text-foreground mb-4">관련 토픽</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {topics.map((topic) => (
          <RelatedTopicCard key={topic.id} topic={topic} />
        ))}
      </div>
    </div>
  );
}
