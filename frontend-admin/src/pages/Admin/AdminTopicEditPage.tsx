import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Topic } from "../../types";

const AdminTopicEditPage = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Partial<Topic>>({});

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const response = await axios.get(`/api/admin/topics/suggested`);
        const currentTopic = response.data.find((t: Topic) => t.id === Number(topicId));
        if (currentTopic) {
          setTopic({
            ...currentTopic,
            display_name: currentTopic.display_name,
            embedding_keywords: currentTopic.embedding_keywords || currentTopic.search_keywords,
          });
        }
      } catch (error) {
        console.error("Error fetching topic:", error);
      }
    };
    fetchTopic();
  }, [topicId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTopic({ ...topic, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.patch(`/api/admin/topics/${topicId}/publish`, {
        displayName: topic.display_name,
        embeddingKeywords: topic.embedding_keywords,
        summary: topic.summary || "",
        stanceLeft: topic.stance_left,
        stanceRight: topic.stance_right,
        voteStartAt: topic.vote_start_at,
        voteEndAt: topic.vote_end_at,
      });
      alert("토픽이 성공적으로 발행되었습니다.");
      navigate("/admin");
    } catch (error) {
      console.error("Error publishing topic:", error);
      alert("발행 실패");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">ROUND2 토픽 편집 및 발행 (ID: {topicId})</h1>
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
            <CardTitle>토픽 정보 수정</CardTitle>
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

              <div>
                <label htmlFor="vote_start_at" className="block text-sm font-medium text-gray-700 mb-1">
                  투표 시작 시간 (YYYY-MM-DD HH:mm)
                </label>
                <input
                  type="text"
                  name="vote_start_at"
                  value={topic.vote_start_at || ""}
                  onChange={handleChange}
                  placeholder="2025-01-01 09:00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="vote_end_at" className="block text-sm font-medium text-gray-700 mb-1">
                  투표 종료 시간 (YYYY-MM-DD HH:mm)
                </label>
                <input
                  type="text"
                  name="vote_end_at"
                  value={topic.vote_end_at || ""}
                  onChange={handleChange}
                  placeholder="2025-01-07 23:59"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button type="submit" className="w-full">
                저장 및 발행
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminTopicEditPage;
