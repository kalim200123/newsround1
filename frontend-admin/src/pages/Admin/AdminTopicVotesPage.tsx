import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

interface VoteStatistics {
  topic: {
    id: number;
    display_name: string;
    vote_start_at: string;
    vote_end_at: string;
    status: string;
    stance_left: string;
    stance_right: string;
  };
  statistics: {
    total_votes: number;
    left_votes: number;
    right_votes: number;
    left_percentage: number;
    right_percentage: number;
  };
  voters: Array<{
    id: number;
    side: "LEFT" | "RIGHT";
    created_at: string;
    user: {
      id: number;
      nickname: string;
      email: string;
    };
  }>;
}

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR");
};

export default function AdminTopicVotesPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const [data, setData] = useState<VoteStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVoteData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/admin/topics/${topicId}/votes`);
        setData(response.data);
      } catch (err) {
        console.error("Error fetching vote data:", err);
        setError("투표 현황을 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoteData();
  }, [topicId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">{error || "데이터를 불러올 수 없습니다."}</div>
      </div>
    );
  }

  const { topic, statistics, voters } = data;
  const leftVoters = voters.filter((v) => v.side === "LEFT");
  const rightVoters = voters.filter((v) => v.side === "RIGHT");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{topic.display_name}</h1>
              <p className="text-sm text-gray-600 mt-1">투표 현황</p>
            </div>
            <Link to="/admin/topics">
              <Button variant="outline">← 토픽 목록</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Vote Period Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>투표 기간</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-600">시작</span>
                <p className="font-medium">{formatDateTime(topic.vote_start_at)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">종료</span>
                <p className="font-medium">{formatDateTime(topic.vote_end_at)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">상태</span>
                <div className="mt-1">
                  <Badge variant={topic.status === "OPEN" ? "success" : "default"}>
                    {topic.status === "OPEN" ? "진행 중" : topic.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vote Statistics */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>투표 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Total Votes */}
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">{statistics.total_votes}</div>
                <div className="text-sm text-gray-600 mt-1">총 투표 수</div>
              </div>

              {/* Stances */}
              {(topic.stance_left || topic.stance_right) && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-xs text-blue-600 font-semibold mb-1">LEFT 입장</div>
                    <p className="text-sm text-gray-700">{topic.stance_left || "-"}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-red-600 font-semibold mb-1">RIGHT 입장</div>
                    <p className="text-sm text-gray-700">{topic.stance_right || "-"}</p>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-600">LEFT {statistics.left_percentage}%</span>
                  <span className="text-sm font-medium text-red-600">RIGHT {statistics.right_percentage}%</span>
                </div>
                <div className="flex h-8 rounded-lg overflow-hidden">
                  <div
                    className="bg-blue-500 flex items-center justify-center text-white text-sm font-medium"
                    style={{ width: `${statistics.left_percentage}%` }}
                  >
                    {statistics.left_votes > 0 && statistics.left_votes}
                  </div>
                  <div
                    className="bg-red-500 flex items-center justify-center text-white text-sm font-medium"
                    style={{ width: `${statistics.right_percentage}%` }}
                  >
                    {statistics.right_votes > 0 && statistics.right_votes}
                  </div>
                </div>
              </div>

              {/* Vote Counts */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{statistics.left_votes}</div>
                      <div className="text-sm text-blue-700 mt-1">LEFT 투표</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">{statistics.right_votes}</div>
                      <div className="text-sm text-red-700 mt-1">RIGHT 투표</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voter Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT Voters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                LEFT 투표자 ({leftVoters.length}명)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leftVoters.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {leftVoters.map((voter) => (
                    <div key={voter.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
                      <div>
                        <div className="font-medium text-gray-900">{voter.user.nickname}</div>
                        <div className="text-sm text-gray-600">{voter.user.email}</div>
                      </div>
                      <div className="text-xs text-gray-500">{formatDateTime(voter.created_at)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">투표자가 없습니다.</p>
              )}
            </CardContent>
          </Card>

          {/* RIGHT Voters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                RIGHT 투표자 ({rightVoters.length}명)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rightVoters.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {rightVoters.map((voter) => (
                    <div key={voter.id} className="flex items-center justify-between p-3 bg-red-50 rounded-md">
                      <div>
                        <div className="font-medium text-gray-900">{voter.user.nickname}</div>
                        <div className="text-sm text-gray-600">{voter.user.email}</div>
                      </div>
                      <div className="text-xs text-gray-500">{formatDateTime(voter.created_at)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">투표자가 없습니다.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
