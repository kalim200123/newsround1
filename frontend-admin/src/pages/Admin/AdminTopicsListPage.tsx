import { Badge, Button, Card, CardContent } from "@/components/ui";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Pagination from "../../components/Pagination";
import type { Topic } from "../../types";

const ITEMS_PER_PAGE = 20;

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR");
};

const getStatusText = (status: Topic["status"]) => {
  switch (status) {
    case "OPEN":
      return "발행됨";
    case "PREPARING":
      return "준비 중";
    case "CLOSED":
      return "종료됨";
    default:
      return status || "-";
  }
};

const getStatusVariant = (status: Topic["status"]): "default" | "success" | "warning" | "destructive" => {
  switch (status) {
    case "OPEN":
      return "success";
    case "PREPARING":
      return "warning";
    case "CLOSED":
      return "default";
    default:
      return "default";
  }
};

type TabType = "PREPARING" | "OPEN" | "CLOSED" | "ALL";

export default function AdminTopicsListPage() {
  const location = useLocation();
  const initialTab = (location.state as { initialTab?: TabType })?.initialTab || "ALL";

  const [topics, setTopics] = useState<Topic[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [counts, setCounts] = useState({ ALL: 0, OPEN: 0, PREPARING: 0, CLOSED: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  useEffect(() => {
    const fetchTopics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params: { limit: number; page: number; status?: TabType } = {
          limit: ITEMS_PER_PAGE,
          page: currentPage,
        };
        if (activeTab !== "ALL") {
          params.status = activeTab;
        }

        const response = await axios.get(`/api/admin/topics`, { params });
        setTopics(Array.isArray(response.data.topics) ? response.data.topics : []);
        setTotalCount(response.data.total || 0);
        if (response.data.counts) {
          setCounts(response.data.counts);
        }
      } catch (err) {
        setError("토픽 목록을 불러오는 데 실패했습니다.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopics();
  }, [currentPage, activeTab]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">전체 토픽 목록</h1>
            <div className="flex gap-3">
              <Link to="/admin/topics/new">
                <Button>+ 새 토픽 생성</Button>
              </Link>
              <Link to="/admin">
                <Button variant="outline">← 대시보드</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => handleTabChange("ALL")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "ALL" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50 border"
            }`}
          >
            전체 <span className="ml-1 text-sm">({counts.ALL})</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("OPEN")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "OPEN" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50 border"
            }`}
          >
            발행됨 <span className="ml-1 text-sm">({counts.OPEN})</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("PREPARING")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "PREPARING" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50 border"
            }`}
          >
            준비 중 <span className="ml-1 text-sm">({counts.PREPARING})</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("CLOSED")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "CLOSED" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50 border"
            }`}
          >
            종료됨 <span className="ml-1 text-sm">({counts.CLOSED})</span>
          </button>
        </div>

        {/* Topics Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading && <div className="text-center py-12 text-gray-500">로딩 중...</div>}
            {error && <div className="text-center py-12 text-red-600">{error}</div>}
            {!isLoading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">상태</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">토픽 이름</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">발행일</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">종료일</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topics.length > 0 ? (
                      topics.map((topic) => (
                        <tr key={topic.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <Badge variant={getStatusVariant(topic.status)}>{getStatusText(topic.status)}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <strong className="text-gray-900">{topic.display_name}</strong>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{formatDateTime(topic.published_at)}</td>
                          <td className="py-3 px-4 text-gray-600">{formatDateTime(topic.vote_end_at)}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Link to={`/admin/topics/${topic.id}`}>
                                <Button variant="ghost" size="sm">
                                  {topic.status === "PREPARING" ? "큐레이션" : "관리"}
                                </Button>
                              </Link>
                              {(topic.status === "OPEN" || topic.status === "CLOSED") && (
                                <Link to={`/admin/topics/${topic.id}/votes`}>
                                  <Button variant="outline" size="sm">
                                    {topic.status === "CLOSED" ? "📊 투표결과" : "📊 투표현황"}
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-gray-500">
                          {activeTab === "PREPARING" && "준비 중인 토픽이 없습니다."}
                          {activeTab === "OPEN" && "발행된 토픽이 없습니다."}
                          {activeTab === "CLOSED" && "종료된 토픽이 없습니다."}
                          {activeTab === "ALL" && "생성된 토픽이 없습니다."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="mt-6">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </main>
    </div>
  );
}
