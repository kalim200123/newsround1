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
    status: string;
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
  return date.toLocaleString("ko-KR");
};

export default function AdminInquiryDetailPage() {
  const { inquiryId } = useParams<{ inquiryId: string }>();
  const [data, setData] = useState<InquiryDetail | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`/api/admin/inquiries/${inquiryId}`);
      setData(res.data);
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

    try {
      await axios.post(`/api/admin/inquiries/${inquiryId}/reply`, {
        content: replyContent,
      });
      setSuccess("답변이 성공적으로 등록되었습니다.");
      setError("");
      setReplyContent("");
      fetchData(); // 데이터 다시 불러오기
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "답변 등록 중 오류가 발생했습니다.");
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
    }
  };

  const handleDownload = async (filePath: string, originalName: string | null) => {
    try {
      const response = await axios.get(`/api/admin/download?path=${encodeURIComponent(filePath)}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      link.setAttribute('download', originalName || 'download');

      document.body.appendChild(link);
      link.click();

      // 정리
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error downloading file:', error);
      setError('파일을 다운로드하는 중 오류가 발생했습니다.');
    }
  };

  if (error && !data) {
    return <div className="admin-container">{error}</div>;
  }

  if (!data) {
    return <div className="admin-container">로딩 중...</div>;
  }

  const { inquiry, reply } = data;

  return (
    <div className="admin-container admin-page">
      <div className="admin-back-row">
        <Link to="/admin" className="back-link">
          ← 목록으로 돌아가기
        </Link>
      </div>

      <section className="admin-section">
        <div className="admin-section-header">
          <h2>문의 상세 내역</h2>
        </div>
        <div className="inquiry-detail-card">
          <h3>{inquiry.subject}</h3>
          <div className="inquiry-meta">
            <span>
              <strong>작성자:</strong> {inquiry.user_nickname} ({inquiry.user_email})
            </span>
            <span>
              <strong>문의 시각:</strong> {formatDateTime(inquiry.created_at)}
            </span>
            <span>
              <strong>상태:</strong> {inquiry.status === "REPLIED" ? "답변 완료" : "답변 대기"}
            </span>
          </div>
          <div className="inquiry-content">
            <p>{inquiry.content}</p>
          </div>
          {inquiry.file_path && (
            <div className="inquiry-attachment">
              <strong>첨부파일:</strong>
              <button type="button" className="link-button" onClick={() => handleDownload(inquiry.file_path!, inquiry.file_originalname)}>
                {inquiry.file_originalname || '파일 보기'}
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-header">
          <h2>답변 관리</h2>
        </div>
        {reply ? (
          <div className="inquiry-reply-card">
            <div className="inquiry-meta">
              <span>
                <strong>답변 시각:</strong> {formatDateTime(reply.created_at)}
              </span>
            </div>
            <div className="inquiry-content">
              <p>{reply.content}</p>
            </div>
          </div>
        ) : (
          <form className="reply-form" onSubmit={handleReplySubmit}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="답변을 입력하세요..."
              rows={8}
              required
            />
            <button type="submit" className="submit-btn">답변 등록</button>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
          </form>
        )}
      </section>
    </div>
  );
}