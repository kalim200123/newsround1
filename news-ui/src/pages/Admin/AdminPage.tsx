import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Topic } from "../../types";
import { useAdminAuth } from "../../context/AdminAuthContext";

const formatPublishedAt = (value?: string | null) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}.${month}.${day} ${hours}:${minutes}`;
};

const TOPIC_PROMPT = "현재 대한민국에서 가장 인기있는 토픽 5개와 각 토픽에 대한 단어형 키워드 3~5개, 중도 입장에서의 요약을 작성해줘.";

export default function AdminPage() {
  const [suggestedTopics, setSuggestedTopics] = useState<Topic[]>([]);
  const [publishedTopics, setPublishedTopics] = useState<Topic[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  const handleCopyPrompt = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(TOPIC_PROMPT);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = TOPIC_PROMPT;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      alert("프롬프트를 클립보드에 복사했습니다.");
    } catch (error) {
      console.error("Failed to copy prompt", error);
      alert("복사에 실패했습니다. 브라우저 설정을 확인해 주세요.");
    }
  };

  const fetchData = async () => {
    try {
      const [suggestedRes, publishedRes] = await Promise.all([
        axios.get("http://localhost:3000/admin/topics/suggested"),
        axios.get("http://localhost:3000/admin/topics/published"),
      ]);
      setSuggestedTopics(suggestedRes.data);
      setPublishedTopics(publishedRes.data);
    } catch (error) {
      console.error("토픽 데이터를 불러오는 중 오류가 발생했습니다.", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [location.pathname]);

  const handleReject = async (topicId: number) => {
    try {
      await axios.patch(`http://localhost:3000/admin/topics/${topicId}/reject`);
      alert(`토픽 #${topicId}을(를) 거절했습니다.`);
      fetchData();
    } catch (error) {
      console.error("토픽 거절 처리 중 오류가 발생했습니다.", error);
      alert("토픽 거절에 실패했습니다.");
    }
  };

  const suggestedCount = suggestedTopics.length;
  const publishedCount = publishedTopics.length;

  return (
    <div className="admin-container admin-page">
      <div className="admin-back-row">
        <Link to="/" className="back-link">
          ← 홈으로 돌아가기
        </Link>
        <button type="button" className="logout-btn" onClick={handleLogout}>
          로그아웃
        </button>
      </div>

      <section className="admin-hero">
        <div className="admin-hero-text">
          <h1>관리자 센터</h1>
          <p>추천된 토픽을 빠르게 검토하고 필요한 작업을 진행하세요.</p>
        </div>

        <div className="admin-metrics">
          <div className="admin-metric-card">
            <span className="metric-label">후보 토픽</span>
            <span className="metric-value">{suggestedCount}</span>
          </div>
          <div className="admin-metric-card">
            <span className="metric-label">발행 토픽</span>
            <span className="metric-value">{publishedCount}</span>
          </div>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2>후보 토픽 목록</h2>
            <p className="admin-section-subtitle">AI가 추천한 토픽을 검토하거나 거절할 수 있습니다.</p>
          </div>
          <div className="admin-section-actions">
            <button type="button" onClick={handleCopyPrompt} className="create-new-topic-btn">
              프롬프트 복사
            </button>
            <Link to="/admin/topics/new" className="create-new-topic-btn">
              + 토픽 직접 생성
            </Link>
          </div>
        </div>

        {suggestedCount > 0 ? (
          <div className="admin-section-body">
            {suggestedTopics.map((topic) => (
              <article key={topic.id} className="topic-approval-item admin-topic-card">
                <div className="topic-info">
                  <h3>{topic.core_keyword}</h3>
                  <p>{topic.sub_description || "추가 설명이 등록되지 않았습니다."}</p>
                </div>
                <div className="topic-actions">
                  <Link to={`/admin/topics/${topic.id}/edit`} className="edit-btn-link">
                    상세 검토
                  </Link>
                  <button type="button" onClick={() => handleReject(topic.id)} className="reject-btn">
                    거절
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-empty-state">
            <h3>후보 토픽이 없습니다</h3>
            <p>새로운 추천이 도착하면 이곳에 표시됩니다.</p>
          </div>
        )}
      </section>

      <section className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2>발행된 토픽</h2>
            <p className="admin-section-subtitle">큐레이션 페이지로 이동해 기사 상태를 조정할 수 있습니다.</p>
          </div>
        </div>

        {publishedCount > 0 ? (
          <div className="admin-section-body">
            {publishedTopics.map((topic) => (
              <article key={topic.id} className="topic-approval-item admin-topic-card">
                <div className="topic-info">
                  <h3>{topic.display_name || topic.core_keyword}</h3>
                  <p className="topic-meta">
                    {topic.published_at ? `${formatPublishedAt(topic.published_at)} 발행` : "발행일 미정"}
                  </p>
                </div>
                <div className="topic-actions">
                  <Link to={`/admin/topics/${topic.id}`} className="edit-btn-link curation-btn">
                    큐레이션 관리
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-empty-state">
            <h3>발행된 토픽이 없습니다</h3>
            <p>토픽을 발행하면 이곳에서 관리할 수 있습니다.</p>
          </div>
        )}
      </section>
    </div>
  );
}
