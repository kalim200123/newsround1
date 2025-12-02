import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import WeeklyVisitorsChart from "../../components/WeeklyVisitorsChart";
import { useAdminAuth } from "../../context/AdminAuthContext";
import type { Topic } from "../../types";

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, topicsRes, inquiriesRes] = await Promise.all([
          axios.get("/api/admin/stats"),
          axios.get("/api/admin/topics?limit=3&status=OPEN"),
          axios.get("/api/admin/inquiries?limit=3"),
        ]);
        setStats(statsRes.data);
        setRecentTopics(topicsRes.data.topics || []);
        setRecentInquiries(inquiriesRes.data.inquiries || []);
      } catch (error) {
        console.error("대시보드 데이터를 불러오는 중 오류가 발생했습니다.", error);
        setStats(
          (prev) =>
            prev ?? {
              topics: { published: 0, suggested: 0 },
              inquiries: { total: 0, pending: 0 },
              users: { total: 0, today: 0 },
            }
        );
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                navigate("/admin/login", { replace: true });
              }}
            >
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">총 발행 토픽</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.topics.published ?? "..."}</div>
              <p className="text-sm text-gray-500 mt-1">전체 발행된 토픽</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">답변 대기 문의</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats?.inquiries.pending ?? "..."}</div>
              <p className="text-sm text-gray-500 mt-1">처리 필요</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">총 사용자</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.users.total ?? "..."}</div>
              <p className="text-sm text-gray-500 mt-1">전체 가입자</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">오늘 가입자</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.users.today ?? "..."}</div>
              <p className="text-sm text-gray-500 mt-1">신규 가입</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities - Horizontal Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Topics */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>최근 토픽</CardTitle>
              <Link to="/admin/topics" state={{ initialTab: "ALL" }}>
                <Button variant="ghost" size="sm">
                  전체 보기 →
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentTopics.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {recentTopics.map((item) => (
                    <li key={item.id} className="py-3 hover:bg-gray-50 transition-colors">
                      <Link to={`/admin/topics/${item.id}`} className="block">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{item.display_name}</span>
                          <Badge variant={item.status === "PREPARING" ? "warning" : "success"}>
                            {item.status === "PREPARING" ? "미발행" : "발행됨"}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500 mt-1 block">
                          {item.status === "PREPARING" ? "준비 중" : `${formatDateTime(item.published_at)} 발행`}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center py-8">토픽이 없습니다.</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Inquiries */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>최근 문의</CardTitle>
              <Link to="/admin/inquiries">
                <Button variant="ghost" size="sm">
                  전체 보기 →
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentInquiries.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {recentInquiries.map((item) => (
                    <li key={item.id} className="py-3 hover:bg-gray-50 transition-colors">
                      <Link to={`/admin/inquiries/${item.id}`} className="block">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{item.subject}</span>
                          <Badge variant={item.status === "PENDING" ? "warning" : "default"}>
                            {item.status === "PENDING" ? "대기" : "답변완료"}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500 mt-1 block">
                          {item.user_nickname} · {formatDateTime(item.created_at)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center py-8">최근 문의가 없습니다.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>주요 기능</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/admin/topics/new">
                  <Button className="w-full">+ 새 토픽 생성</Button>
                </Link>
                <Link to="/admin/users">
                  <Button variant="outline" className="w-full">
                    사용자 관리
                  </Button>
                </Link>
                <Link to="/admin/keywords">
                  <Button variant="outline" className="w-full">
                    키워드 관리
                  </Button>
                </Link>

                <Link to="/admin/notifications">
                  <Button variant="outline" className="w-full">
                    알림 발송
                  </Button>
                </Link>
                <Button variant="outline" className="w-full" onClick={handleCopyPrompt}>
                  AI 프롬프트 복사
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Visitors Chart */}
          <Card>
            <CardHeader>
              <CardTitle>주간 방문자 통계</CardTitle>
            </CardHeader>
            <CardContent>
              <WeeklyVisitorsChart />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
