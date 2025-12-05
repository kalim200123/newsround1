import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Topic } from "../../types";

const AdminTopicCreatePage = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Partial<Topic>>({
    display_name: "",
    embedding_keywords: "",
    summary: "",
    stance_left: "",
    stance_right: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTopic({ ...topic, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.display_name || !topic.embedding_keywords) {
      alert("대표 토픽명과 임베딩 키워드는 필수입니다.");
      return;
    }

    try {
      await axios.post(`/api/admin/topics`, {
        displayName: topic.display_name,
        searchKeywords: topic.embedding_keywords,
        summary: topic.summary || "",
        stanceLeft: topic.stance_left || "",
        stanceRight: topic.stance_right || "",
      });
      alert("새 토픽이 성공적으로 생성되었습니다. (준비 상태)");
      navigate("/admin");
    } catch (error) {
      console.error("Error creating topic:", error);
      alert("새 토픽 생성에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">새 ROUND2 토픽 생성</h1>
            <Link to="/admin">
              <Button variant="outline">← 목록으로</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>토픽 정보 입력</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-1">
                  토픽 주제 *
                </label>
                <input
                  type="text"
                  name="display_name"
                  value={topic.display_name || ""}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="embedding_keywords" className="block text-sm font-medium text-gray-700 mb-1">
                  임베딩 키워드 (쉼표로 구분) *
                </label>
                <input
                  type="text"
                  name="embedding_keywords"
                  value={topic.embedding_keywords || ""}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="stance_left" className="block text-sm font-medium text-gray-700 mb-1">
                  LEFT 주장
                </label>
                <input
                  type="text"
                  name="stance_left"
                  value={topic.stance_left || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="stance_right" className="block text-sm font-medium text-gray-700 mb-1">
                  RIGHT 주장
                </label>
                <input
                  type="text"
                  name="stance_right"
                  value={topic.stance_right || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
                  토픽 요약
                </label>
                <textarea
                  name="summary"
                  value={topic.summary || ""}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button type="submit" className="w-full">
                토픽 생성 (준비)
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminTopicCreatePage;
