import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// 템플릿 예시
const NOTIFICATION_TEMPLATES = [
  {
    name: "🔥 속보 알림",
    type: "BREAKING_NEWS",
    message: "[제목]\n[출처]\n지금 바로 확인하세요!",
    url: "/article/[토픽ID]",
  },
  {
    name: "⚡ 단독 보도",
    type: "EXCLUSIVE_NEWS",
    message: "[제목]\n[출처]\n지금 바로 확인하세요!",
    url: "/article/[토픽ID]",
  },
  {
    name: "🎯 ROUND2 시작",
    type: "NEW_TOPIC",
    message:
      "💬 '[토픽명]' 토픽의 ROUND2가 시작되었습니다!\n\n이제 좌우 입장에 대해 의견을 나누고 투표해보세요.\n토론 기간: [종료일시]까지",
    url: "/debate/[토픽ID]",
  },
  {
    name: "⏰ 투표 독려",
    type: "VOTE_REMINDER",
    message: "⏰ '[토픽명]' 토픽 투표 마감 [시간]시간 전입니다.\n아직 참여하지 않으셨다면 지금 투표하세요!",
    url: "/debate/[토픽ID]",
  },
  {
    name: "🔧 서버 점검 안내",
    type: "ADMIN_NOTICE",
    message:
      "🔧 서버 점검이 예정되어 있습니다.\n일시: [날짜 및 시간 입력]\n예상 소요 시간: [시간 입력]\n불편을 드려 죄송합니다.",
    url: "",
  },
  {
    name: "✨ 신규 기능 안내",
    type: "ADMIN_NOTICE",
    message: "✨ 새로운 기능이 추가되었습니다!\n[기능 설명]\n지금 바로 확인해보세요.",
    url: "",
  },
  {
    name: "📢 중요 공지사항",
    type: "ADMIN_NOTICE",
    message: "📢 중요한 공지사항이 있습니다.\n[공지 내용]",
    url: "",
  },
  {
    name: "🎉 이벤트 안내",
    type: "ADMIN_NOTICE",
    message: "🎉 이벤트가 진행 중입니다!\n[이벤트 내용]\n참여하고 혜택을 받아보세요.",
    url: "",
  },
];

export default function AdminNotificationPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [relatedUrl, setRelatedUrl] = useState("");
  const [userId, setUserId] = useState(""); // Optional: specific user ID
  const [type, setType] = useState("ADMIN_NOTICE");
  const [isSending, setIsSending] = useState(false);

  const applyTemplate = (template: (typeof NOTIFICATION_TEMPLATES)[0]) => {
    setMessage(template.message);
    setRelatedUrl(template.url);
    setType(template.type);
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("메시지를 입력해주세요.");
      return;
    }

    if (!confirm("정말로 알림을 발송하시겠습니까?")) return;

    setIsSending(true);
    try {
      interface NotificationPayload {
        message: string;
        related_url?: string;
        user_id?: number;
        type: string;
      }
      const payload: NotificationPayload = {
        message,
        related_url: relatedUrl || undefined,
        type,
      };
      if (userId.trim()) {
        payload.user_id = parseInt(userId, 10);
      }

      const res = await axios.post("/api/admin/notifications", payload);
      toast.success(`알림이 성공적으로 발송되었습니다. (${res.data.sent_count || "전체"}명)`);
      setMessage("");
      setRelatedUrl("");
      setUserId("");
      setType("ADMIN_NOTICE");
    } catch (error) {
      console.error("Failed to send notification:", error);
      toast.error("알림 발송에 실패했습니다.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">알림 발송</h1>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            돌아가기
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>새 알림 작성</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 템플릿 빠른 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">템플릿 빠른 선택</label>
              <div className="grid grid-cols-2 gap-2">
                {NOTIFICATION_TEMPLATES.map((template) => (
                  <Button
                    key={template.name}
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(template)}
                    type="button"
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">* 템플릿을 선택하면 메시지와 URL이 자동으로 채워집니다.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">수신자 ID (선택사항)</label>
              <Input
                placeholder="특정 사용자에게만 보낼 경우 ID 입력 (비워두면 전체 발송)"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                type="number"
              />
              <p className="text-xs text-gray-500 mt-1">* 비워두면 모든 사용자에게 알림이 발송됩니다.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">알림 유형</label>
              <select className="w-full p-2 border rounded-md" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="ADMIN_NOTICE">일반 공지 (ADMIN_NOTICE)</option>
                <option value="BREAKING_NEWS">속보 (BREAKING_NEWS)</option>
                <option value="EXCLUSIVE_NEWS">단독 (EXCLUSIVE_NEWS)</option>
                <option value="NEW_TOPIC">새 토픽 (NEW_TOPIC)</option>
                <option value="VOTE_REMINDER">투표 독려 (VOTE_REMINDER)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                메시지 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full min-h-[100px] p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
                placeholder="알림 메시지를 입력하세요..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">관련 URL (선택사항)</label>
              <Input
                placeholder="예: /debate/420076"
                value={relatedUrl}
                onChange={(e) => setRelatedUrl(e.target.value)}
              />
            </div>

            <div className="pt-4">
              <Button className="w-full" onClick={handleSend} disabled={isSending}>
                {isSending ? "발송 중..." : "알림 발송하기"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
