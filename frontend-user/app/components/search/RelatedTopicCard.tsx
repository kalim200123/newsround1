"use client";

import Link from 'next/link';
import { Topic } from '@/lib/types/topic';

interface RelatedTopicCardProps {
  topic: Topic;
}

export default function RelatedTopicCard({ topic }: RelatedTopicCardProps) {
  return (
    <Link href={`/debate/${topic.id}`} className="block group">
      <div className="bg-card/50 border border-border rounded-lg p-4 h-full transition-all duration-300 ease-in-out group-hover:bg-card group-hover:border-red-500/50 group-hover:-translate-y-1">
        <h4 className="text-md font-bold text-foreground truncate">{topic.display_name}</h4>
        <div className="text-sm text-muted-foreground mt-2">
            <span>{topic.stance_left}</span> vs <span>{topic.stance_right}</span>
        </div>
        <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
          <span>총 {topic.total_votes}표</span>
        </div>
      </div>
    </Link>
  );
}
