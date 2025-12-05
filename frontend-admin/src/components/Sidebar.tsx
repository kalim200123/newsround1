import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPublishedTopics } from "../api";
import type { Topic } from "../types";

const MAX_TOPICS = 10;

const Sidebar = () => {
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const allTopics = await fetchPublishedTopics();
        setTopics(allTopics.slice(0, MAX_TOPICS));
      } catch (error) {
        console.error("사이드바 토픽을 불러오는 중 오류가 발생했습니다.", error);
      }
    };

    loadTopics();
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-topic-section">
        <h2 className="sidebar-title">다른 토픽 둘러보기</h2>
        {topics.length > 0 ? (
          <ul className="sidebar-topic-list">
            {topics.map((topic) => (
              <li key={topic.id}>
                <Link to={`/topics/${topic.id}`}>{topic.display_name || topic.core_keyword}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="sidebar-empty">표시할 토픽이 아직 없습니다.</p>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
