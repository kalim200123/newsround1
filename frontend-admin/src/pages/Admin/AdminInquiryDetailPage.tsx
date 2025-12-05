import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";

interface InquiryDetail {
  inquiry: {
    id: number;
    subject: string;
    content: string;
    file_path: string | null;
    file_originalname: string | null;
    status: "SUBMITTED" | "RESOLVED";
    created_at: string;
    user_nickname: string;
    user_email: string;
  };
  reply: {
    id: number;
    content: string;
    created_at: string;
  } | null;
}

const formatDateTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AdminInquiryDetailPage() {
  const { inquiryId } = useParams<{ inquiryId: string }>();
  const [data, setData] = useState<InquiryDetail | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`/api/admin/inquiries/${inquiryId}`);
      setData(res.data);
      if (res.data.reply) {
        setReplyContent(res.data.reply.content);
      }
    } catch (err) {
      console.error("Error fetching inquiry data:", err);
      setError("문의 내용을 불러오는 데 실패했습니다.");
    }
  }, [inquiryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      setError("답변 내용을 입력해주세요.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await axios.post(`/api/admin/inquiries/${inquiryId}/reply`, {
        content: replyContent,
      });
      setSuccess("답변이 성공적으로 등록되었습니다.");
      fetchData(); // Re-fetch data to show the new reply and updated status
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message
        : "답변 등록 중 오류가 발생했습니다.";
      setError(message || "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (filePath: string, originalName: string | null) => {
    try {
      const response = await axios.get(`/api/admin/download?path=${encodeURIComponent(filePath)}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", originalName || "download");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      setError("파일을 다운로드하는 중 오류가 발생했습니다.");
    }
  };

  if (!data && !error) {
    return <div className="admin-container">로딩 중...</div>;
  }
  if (error && !data) {
    return <div className="admin-container">{error}</div>;
  }
  if (!data) return null;

  const { inquiry, reply } = data;

  return (
    <div className="admin-container inquiry-detail-page">
      <header className="admin-page-header">
        <h1>문의 상세 내역</h1>
        <Link to="/admin/inquiries" className="back-link">
          ← 전체 목록으로
        </Link>
      </header>

      <div className="inquiry-detail-layout">
        {/* Left Column: User Inquiry */}
        <div className="inquiry-card">
          <div className="inquiry-card-header">
            <h3>{inquiry.subject}</h3>
            <span className={`status-badge status-${inquiry.status.toLowerCase()}`}>
              {inquiry.status === "RESOLVED" ? "답변 완료" : "답변 대기"}
            </span>
          </div>
          <div className="inquiry-card-meta">
            <div className="meta-item">
              <span>작성자</span>
              <strong>
                {inquiry.user_nickname} ({inquiry.user_email})
              </strong>
            </div>
            <div className="meta-item">
              <span>문의 시각</span>
              <strong>{formatDateTime(inquiry.created_at)}</strong>
            </div>
          </div>
          <div className="inquiry-card-body">
            <p>{inquiry.content}</p>
          </div>
          {inquiry.file_path && (
            <div className="inquiry-card-footer">
              <button
                type="button"
                className="attachment-btn"
                onClick={() => handleDownload(inquiry.file_path!, inquiry.file_originalname)}
              >
                📎 {inquiry.file_originalname || "첨부파일 다운로드"}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Admin Reply */}
        <div className="reply-card">
          <div className="reply-card-header">
            <h4>{reply ? "등록된 답변" : "답변 작성"}</h4>
          </div>
          <div className="reply-card-body">
            <form onSubmit={handleReplySubmit}>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="답변을 입력하세요..."
                rows={12}
                required
                readOnly={!!reply}
                className={reply ? "readonly" : ""}
              />
              {!reply && (
                <div className="reply-form-actions">
                  <button type="submit" className="submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? "등록 중..." : "답변 등록"}
                  </button>
                </div>
              )}
              {error && <p className="error-message">{error}</p>}
              {success && <p className="success-message">{success}</p>}
            </form>
          </div>
          {reply && (
            <div className="reply-card-footer">
              <span>답변 일시: {formatDateTime(reply.created_at)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}