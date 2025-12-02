import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface TrendingKeyword {
  id: number;
  keyword: string;
}

export default function AdminKeywordPage() {
  const [keywords, setKeywords] = useState<TrendingKeyword[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchKeywords = async () => {
    try {
      const { data } = await axios.get("/api/admin/trending-keywords");
      setKeywords(Array.isArray(data.keywords) ? data.keywords : []);
    } catch (error) {
      console.error("Error fetching keywords:", error);
      setKeywords([]);
    }
  };

  useEffect(() => {
    fetchKeywords();
  }, []);

  const handleCreate = async () => {
    if (!newKeyword.trim()) return;
    setLoading(true);
    try {
      await axios.post("/api/admin/trending-keywords", {
        keyword: newKeyword.trim(),
      });
      setNewKeyword("");
      fetchKeywords();
    } catch (error) {
      console.error("Error creating keyword:", error);
      alert("키워드 생성 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("키워드를 삭제하시겠습니까?")) return;
    try {
      await axios.delete(`/api/admin/trending-keywords/${id}`);
      fetchKeywords();
    } catch (error) {
      console.error("Error deleting keyword:", error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>트렌딩 키워드 관리 (이슈 NOW)</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Create Form */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="키워드 (예: AI)"
              value={newKeyword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "생성 중..." : "생성"}
            </Button>
          </div>
          {/* Keyword List */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>키워드</TableHead>
                <TableHead>액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keywords.map((kw) => (
                <TableRow key={kw.id}>
                  <TableCell>{kw.keyword}</TableCell>
                  <TableCell>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(kw.id)}>
                      삭제
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4">
            <Link to="/admin">
              <Button variant="outline">← 관리자 대시보드</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
