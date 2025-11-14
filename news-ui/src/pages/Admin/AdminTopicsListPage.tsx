import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "../../components/Pagination";
import type { Topic } from "../../types";

const ITEMS_PER_PAGE = 20;

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR");
};

const getStatusText = (status: Topic["status"]) => {
  switch (status) {
    case "published":
      return "발행됨";
    case "suggested":
      return "제안됨";
    case "rejected":
      return "거절됨";
    case "archived":
      return "보관됨";
    default:
      return status;
  }
};

export default function AdminTopicsListPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/admin/topics`, {
          params: {
            limit: ITEMS_PER_PAGE,
            page: currentPage,
          },
        });
        setTopics(response.data.topics);
        setTotalCount(response.data.total);
      } catch (err) {
        setError("토픽 목록을 불러오는 데 실패했습니다.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopics();
  }, [currentPage]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="admin-container">
      <header className="admin-page-header">
        <div>
          <h1>전체 토픽 목록</h1>
        </div>
        <div className="admin-page-actions">
          <Link to="/admin/topics/new" className="create-new-topic-btn">
            + 새 토픽 생성
          </Link>
          <Link to="/admin" className="back-link">
            ← 대시보드로 돌아가기
          </Link>
        </div>
      </header>

      <div className="admin-table-container">
        {isLoading && <p>로딩 중...</p>}
        {error && <p className="error-message">{error}</p>}
        {!isLoading && !error && (
          <table>
            <thead>
              <tr>
                <th>상태</th>
                <th>토픽 이름</th>
                <th>검색 키워드</th>
                <th>발행일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {topics.length > 0 ? (
                topics.map((topic) => (
                  <tr key={topic.id}>
                    <td>
                      <span className={`status-badge status-${topic.status?.toLowerCase()}`}>
                        {getStatusText(topic.status)}
                      </span>
                    </td>
                    <td><strong>{topic.display_name || topic.core_keyword}</strong></td>
                    <td>{topic.search_keywords}</td>
                    <td>{formatDateTime(topic.published_at)}</td>
                    <td>
                      <Link to={`/admin/topics/${topic.id}`} className="table-action-btn">
                        큐레이션
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>생성된 토픽이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
