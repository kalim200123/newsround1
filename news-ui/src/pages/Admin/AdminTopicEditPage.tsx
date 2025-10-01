// src/pages/Admin/AdminTopicEditPage.tsx
import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Topic } from "../../types";

const AdminTopicEditPage = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Partial<Topic>>({});

  useEffect(() => {
    // 기존 토픽 정보를 불러와 폼에 채웁니다.
    const fetchTopic = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/admin/topics/suggested`);
        const currentTopic = response.data.find((t: Topic) => t.id === Number(topicId));
        if (currentTopic) {
          setTopic({
            ...currentTopic,
            display_name: currentTopic.core_keyword,
            search_keywords: `${currentTopic.core_keyword}, ${currentTopic.sub_description}`,
          });
        }
      } catch (error) {
        console.error("Error fetching topic:", error);
      }
    };
    fetchTopic();
  }, [topicId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTopic({ ...topic, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.patch(`http://localhost:3000/admin/topics/${topicId}/publish`, {
        displayName: topic.display_name,
        searchKeywords: topic.search_keywords,
        summary: topic.summary || "",
      });
      alert("토픽이 성공적으로 발행되었습니다.");
      navigate("/admin"); // 저장 후 목록 페이지로 이동
    } catch (error) {
      console.error("Error publishing topic:", error);
      alert("발행 실패");
    }
  };

  return (
    <div className="admin-container">
      <Link to="/admin" className="back-link">
        ← 목록으로
      </Link>
      <h1>토픽 편집 및 발행 (ID: {topicId})</h1>
      <form onSubmit={handleSubmit} className="topic-edit-form">
        <div className="edit-field">
          <label>AI 추천 키워드</label>
          <div className="ai-suggestion">
            {topic.core_keyword} / {topic.sub_description}
          </div>
        </div>
        <div className="edit-field">
          <label htmlFor="display_name">대표 토픽명</label>
          <input type="text" name="display_name" value={topic.display_name || ""} onChange={handleChange} required />
        </div>
        <div className="edit-field">
          <label htmlFor="search_keywords">검색용 키워드</label>
          <input
            type="text"
            name="search_keywords"
            value={topic.search_keywords || ""}
            onChange={handleChange}
            required
          />
        </div>
        <div className="edit-field">
          <label htmlFor="summary">중립 요약</label>
          <textarea name="summary" value={topic.summary || ""} onChange={handleChange} rows={5}></textarea>
        </div>
        {/* 썸네일 URL 필드는 나중에 추가할 수 있습니다 */}
        <button type="submit" className="save-btn">
          저장 및 발행
        </button>
      </form>
    </div>
  );
};

export default AdminTopicEditPage;