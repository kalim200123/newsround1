// src/components/TopicList.tsx

import { useEffect, useState } from "react";
import { fetchPublishedTopics } from "../api";
import type { Topic } from "../types"; // Topic 타입을 불러옵니다.
import TopicCard from "./TopicCard"; // 방금 만든 TopicCard를 불러옵니다.

const TopicList = () => {
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const data = await fetchPublishedTopics();
        setTopics(data);
      } catch (error) {
        console.error("Error fetching topics:", error);
      }
    };
    loadTopics();
  }, []);

  return (
    <main className="topic-list">
      {topics.map((topic) => (
        // 각 topic 데이터를 TopicCard 컴포넌트에 props로 전달합니다.
        <TopicCard key={topic.id} topic={topic} />
      ))}
    </main>
  );
};

export default TopicList;
