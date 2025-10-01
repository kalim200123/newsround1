// src/pages/Admin/AdminTopicCreatePage.tsx
import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Topic } from "../../types";

const AdminTopicCreatePage = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Partial<Topic>>({
    display_name: "",
    search_keywords: "",
    summary: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTopic({ ...topic, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.display_name || !topic.search_keywords) {
      alert("대표 토픽명과 검색용 키워드는 필수입니다.");
      return;
    }

    try {
      await axios.post(`http://localhost:3000/admin/topics`, {
        displayName: topic.display_name,
        searchKeywords: topic.search_keywords,
        summary: topic.summary || "",
      });
      alert("새 토픽이 성공적으로 생성 및 발행되었습니다.");
      navigate("/admin"); // 저장 후 목록 페이지로 이동
    } catch (error) {
      console.error("Error creating topic:", error);
      alert("새 토픽 생성에 실패했습니다.");
    }
  };

  return (
    <div className="admin-container">
      <Link to="/admin" className="back-link">
        ← 목록으로
      </Link>
      <h1>새 토픽 생성 및 발행</h1>
      <form onSubmit={handleSubmit} className="topic-edit-form">
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
        <button type="submit" className="save-btn">
          저장 및 발행
        </button>
      </form>
    </div>
  );
};

export default AdminTopicCreatePage;
