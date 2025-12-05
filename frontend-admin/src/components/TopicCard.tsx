// src/components/TopicCard.tsx
import { Link } from "react-router-dom"; // Link 컴포넌트를 불러옵니다.
import type { Topic } from "../types"; // Topic 타입을 불러옵니다.

interface TopicCardProps {
  topic: Topic;
}

// 날짜 형식을 'YYYY년 MM월 DD일'로 바꿔주는 간단한 함수
const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};

const TopicCard = ({ topic }: TopicCardProps) => {
  return (
    <Link to={`/topics/${topic.id}`} className="topic-card-link">
      <div className="topic-card">
        {/* 기존 h2 태그를 div로 변경하여 구조를 잡습니다. */}
        <div className="topic-card-header">
          <h2>{topic.display_name}</h2>
          <small className="topic-card-date">{formatDate(topic.published_at)}</small>
        </div>
        {/* summary를 표시하는 p 태그를 추가합니다. */}
        <p className="topic-card-summary">{topic.summary}</p>
      </div>
    </Link>
  );
};

export default TopicCard;
