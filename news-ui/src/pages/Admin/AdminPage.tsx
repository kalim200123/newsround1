import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import type { Topic } from "../../types";

import WeeklyVisitorsChart from "../../components/WeeklyVisitorsChart";

// 타입 정의
interface Inquiry {
  id: number;
  subject: string;
  status: "PENDING" | "REPLIED";
  created_at: string;
  user_nickname: string;
}

interface AdminStats {
  topics: {
    published: number;
    suggested: number;
  };
  inquiries: {
    total: number;
    pending: number;
  };
  users: {
    total: number;
    today: number;
  };
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PROMPT_TEXT =
  "현재 대한민국에서 가장 인기있는 토픽 5개(한경오합쳐서 기사 10개, 조중동에 기사 10개 정도는 있어야 함)와 각 토픽에 대한 단어형 키워드 3~5개, 중도 입장에서의 요약을 작성해줘.";

const handleCopyPrompt = () => {
  navigator.clipboard
    .writeText(PROMPT_TEXT)
    .then(() => {
      toast.success("프롬프트 텍스트가 클립보드에 복사되었습니다!");
    })
    .catch((err) => {
      console.error("Failed to copy prompt text: ", err);
      toast.error("프롬프트 텍스트 복사에 실패했습니다.");
    });
};

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentTopics, setRecentTopics] = useState<Topic[]>([]);
  const [recentInquiries, setRecentInquiries] = useState<Inquiry[]>([]);
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  const fetchData = async () => {
    try {
      // API 엔드포인트들은 예시이며, 실제 백엔드 구현이 필요합니다.
      const [statsRes, topicsRes, inquiriesRes] = await Promise.all([
        axios.get("/api/admin/stats"), // 가상의 통계 API
        axios.get("/api/admin/topics/published?limit=5"), // 최신 5개 토픽
        axios.get("/api/admin/inquiries?limit=5"), // 최신 5개 문의
      ]);
      setStats(statsRes.data);
      setRecentTopics(topicsRes.data);
      setRecentInquiries(inquiriesRes.data);
    } catch (error) {
      console.error("대시보드 데이터를 불러오는 중 오류가 발생했습니다.", error);
      // 일부 API 실패 시에도 UI가 깨지지 않도록 기본값 설정
      setStats(
        stats ?? {
          topics: { published: 0, suggested: 0 },
          inquiries: { total: 0, pending: 0 },
          users: { total: 0, today: 0 },
        }
      );
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="admin-container">
      <header className="admin-page-header">
        <h1>관리자 대시보드</h1>
        <button
          type="button"
          className="logout-btn"
          onClick={() => {
            logout();
            navigate("/admin/login", { replace: true });
          }}
        >
          로그아웃
        </button>
      </header>

      {/* 1. 핵심 지표 그리드 */}
      <section className="admin-section">
        <div className="metric-grid">
          <div className="metric-card">
            <span className="metric-label">총 발행 토픽</span>
            <span className="metric-value">{stats?.topics.published ?? "..."}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">답변 대기 문의</span>
            <span className="metric-value">{stats?.inquiries.pending ?? "..."}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">총 사용자</span>
            <span className="metric-value">{stats?.users.total ?? "..."}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">오늘 가입자</span>
            <span className="metric-value">{stats?.users.today ?? "..."}</span>
          </div>
        </div>
      </section>

      {/* 2. 메인 대시보드 그리드 (최신 활동 & 주요 기능) */}
      <div className="dashboard-grid">
        {/* 2.1. 최근 활동 섹션 */}
        <div className="dashboard-column">
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3>최근 등록된 문의</h3>
              <Link to="/admin/inquiries" className="view-all-link">
                전체 보기 →
              </Link>
            </div>
            <div className="dashboard-card-body">
              {recentInquiries.length > 0 ? (
                <ul className="activity-list">
                  {recentInquiries.map((item) => (
                    <li key={item.id}>
                      <Link to={`/admin/inquiries/${item.id}`}>
                        <span className="activity-title">{item.subject}</span>
                        <span className="activity-meta">
                          {item.user_nickname} · {formatDateTime(item.created_at)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-list-text">최근 문의가 없습니다.</p>
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3>최근 발행된 토픽</h3>
              <Link to="/admin/topics" className="view-all-link">
                전체 보기 →
              </Link>
            </div>
            <div className="dashboard-card-body">
              {recentTopics.length > 0 ? (
                <ul className="activity-list">
                  {recentTopics.map((item) => (
                    <li key={item.id}>
                      <Link to={`/admin/topics/${item.id}`}>
                        <span className="activity-title">{item.display_name}</span>
                        <span className="activity-meta">{formatDateTime(item.published_at)} 발행</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-list-text">최근 발행된 토픽이 없습니다.</p>
              )}
            </div>
          </div>
        </div>

        {/* 2.2. 주요 기능 및 통계 섹션 */}
        <div className="dashboard-column">
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3>주요 기능</h3>
            </div>
            <div className="dashboard-card-body quick-actions">
              <Link to="/admin/topics/new" className="quick-action-btn">
                + 새 토픽 생성
              </Link>
              <Link to="/admin/users" className="quick-action-btn">
                사용자 관리
              </Link>
              <Link to="/admin/system" className="quick-action-btn">
                시스템 로그
              </Link>
              <button type="button" className="quick-action-btn" onClick={handleCopyPrompt}>
                AI 프롬프트 복사
              </button>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-body">
              <WeeklyVisitorsChart />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
