import { Badge, Button, Card, CardContent } from "@/components/ui";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "../../components/Pagination";

interface User {
  id: number;
  email: string;
  nickname: string;
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  warning_count: number;
  created_at: string;
}

const ITEMS_PER_PAGE = 20;

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR");
};

const getStatusText = (status: User["status"]) => {
  switch (status) {
    case "ACTIVE":
      return "활성";
    case "SUSPENDED":
      return "정지";
    case "DELETED":
      return "탈퇴";
    default:
      return status;
  }
};

const getStatusVariant = (status: User["status"]): "default" | "success" | "warning" | "destructive" => {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "SUSPENDED":
      return "destructive";
    case "DELETED":
      return "default";
    default:
      return "default";
  }
};

export default function AdminUsersListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/admin/users`, {
          params: {
            limit: ITEMS_PER_PAGE,
            page: currentPage,
          },
        });
        setUsers(response.data.users);
        setTotalCount(response.data.total);
      } catch (err) {
        setError("사용자 목록을 불러오는 데 실패했습니다.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">전체 사용자 목록</h1>
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
                      <th className="text-left py-3 px-4 font-medium text-gray-600">ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">닉네임</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">이메일</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">상태</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">경고</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">가입일</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-gray-900">{user.id}</td>
                          <td className="py-3 px-4 font-medium text-gray-900">{user.nickname}</td>
                          <td className="py-3 px-4 text-gray-600">{user.email}</td>
                          <td className="py-3 px-4">
                            <Badge variant={getStatusVariant(user.status)}>{getStatusText(user.status)}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className={user.warning_count > 0 ? "text-red-600 font-medium" : "text-gray-600"}>
                              {user.warning_count}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{formatDateTime(user.created_at)}</td>
                          <td className="py-3 px-4">
                            <Link to={`/admin/users/${user.id}`}>
                              <Button variant="ghost" size="sm">
                                관리
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-500">
                          가입한 사용자가 없습니다.
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
