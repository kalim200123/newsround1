import { Badge, Button, Card, CardContent } from "@/components/ui";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "../../components/Pagination";

interface Inquiry {
  id: number;
  subject: string;
  status: "SUBMITTED" | "IN_PROGRESS" | "RESOLVED";
  created_at: string;
  user_nickname: string;
}

const ITEMS_PER_PAGE = 20;

const formatDateTime = (value?: string) => {
  if (!value) return "";
  return new Date(value).toLocaleString("ko-KR");
};

const getStatusText = (status: Inquiry["status"]) => {
  switch (status) {
    case "SUBMITTED":
      return "답변 대기";
    case "IN_PROGRESS":
      return "답변 중";
    case "RESOLVED":
      return "답변 완료";
    default:
      return status;
  }
};

const getStatusVariant = (status: Inquiry["status"]): "default" | "success" | "warning" | "destructive" => {
  switch (status) {
    case "SUBMITTED":
      return "warning";
    case "IN_PROGRESS":
      return "default";
    case "RESOLVED":
      return "success";
    default:
      return "default";
  }
};

export default function AdminInquiriesListPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInquiries = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/admin/inquiries`, {
          params: {
            limit: ITEMS_PER_PAGE,
            page: currentPage,
          },
        });
        setInquiries(response.data.inquiries || []);
        setTotalCount(response.data.total || 0);
      } catch (err) {
        setError("문의 목록을 불러오는 데 실패했습니다.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInquiries();
  }, [currentPage]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">전체 문의 목록</h1>
            <Link to="/admin">
              <Button variant="outline">← 대시보드</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                      <th className="text-left py-3 px-4 font-medium text-gray-600">제목</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">작성자</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">문의 시각</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.length > 0 ? (
                      inquiries.map((inquiry) => (
                        <tr key={inquiry.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <Badge variant={getStatusVariant(inquiry.status)}>{getStatusText(inquiry.status)}</Badge>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900">{inquiry.subject}</td>
                          <td className="py-3 px-4 text-gray-600">{inquiry.user_nickname}</td>
                          <td className="py-3 px-4 text-gray-600">{formatDateTime(inquiry.created_at)}</td>
                          <td className="py-3 px-4">
                            <Link to={`/admin/inquiries/${inquiry.id}`}>
                              <Button variant="ghost" size="sm">
                                상세 보기
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-gray-500">
                          받은 문의가 없습니다.
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
