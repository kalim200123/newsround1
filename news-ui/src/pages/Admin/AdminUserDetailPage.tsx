import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Pagination from "../../components/Pagination";

const ITEMS_PER_PAGE = 20;

// --- TYPE DEFINITIONS ---
interface User {
  id: number;
  email: string;
  name: string | null;
  nickname: string;
  phone: string | null;
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  warning_count: number;
  created_at: string;
  profile_image_url: string | null;
  introduction: string | null;
}

interface UserComment {
  id: number;
  content: string;
  created_at: string;
  status: string;
  article_id: number;
  article_title: string;
  article_url: string;
}

interface UserChatMessage {
  id: number;
  content: string;
  created_at: string;
  report_count: number;
  status: "ACTIVE" | "HIDDEN" | "DELETED";
  topic_id: number;
  topic_name: string;
}

// --- HELPER FUNCTIONS ---
const formatDateTime = (value?: string) => {
  if (!value) return "";
  return new Date(value).toLocaleString("ko-KR");
};

// --- CHILD COMPONENTS ---

// UserComments Component
const UserComments = ({ userId }: { userId: string }) => {
  const [comments, setComments] = useState<UserComment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get<{ comments: UserComment[], total: number }>(`/api/admin/users/${userId}/comments`, {
          params: {
            limit: ITEMS_PER_PAGE,
            page: currentPage,
          }
        });
        setComments(res.data.comments);
        setTotalCount(res.data.total);
      } catch (err) {
        console.error("Error fetching user comments:", err);
        toast.error("사용자의 댓글 목록을 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchComments();
  }, [userId, currentPage]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (isLoading) return <p>댓글 목록 로딩 중...</p>;
  if (comments.length === 0) return <p>작성한 댓글이 없습니다.</p>;

  return (
    <>
      <div className="admin-table-container">
        <table>
          <thead>
            <tr>
              <th>댓글 내용</th>
              <th>작성일</th>
              <th>상태</th>
              <th>관련 기사</th>
            </tr>
          </thead>
          <tbody>
            {comments.map((comment) => (
              <tr key={comment.id}>
                <td>{comment.content}</td>
                <td>{formatDateTime(comment.created_at)}</td>
                <td>{comment.status}</td>
                <td>
                  <a href={comment.article_url} target="_blank" rel="noopener noreferrer">
                    {comment.article_title}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  );
};

// UserChats Component
const UserChats = ({ userId }: { userId: string }) => {
  const [messages, setMessages] = useState<UserChatMessage[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get<{ messages: UserChatMessage[], total: number }>(`/api/admin/users/${userId}/chats`, {
          params: {
            limit: ITEMS_PER_PAGE,
            page: currentPage,
          }
        });
        setMessages(res.data.messages);
        setTotalCount(res.data.total);
      } catch (err) {
        console.error("Error fetching user chat messages:", err);
        toast.error("사용자의 채팅 목록을 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchChats();
  }, [userId, currentPage]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (isLoading) return <p>채팅 목록 로딩 중...</p>;
  if (messages.length === 0) return <p>작성한 채팅 메시지가 없습니다.</p>;

  return (
    <>
      <div className="admin-table-container">
        <table>
          <thead>
            <tr>
              <th>메시지</th>
              <th>작성일</th>
              <th>신고 수</th>
              <th>상태</th>
              <th>관련 토픽</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((msg) => (
              <tr key={msg.id}>
                <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {msg.content.startsWith('http') ? (
                  <a href={msg.content} target="_blank" rel="noopener noreferrer">파일 보기</a>
                ) : (
                  msg.content
                )}
              </td>
                <td>{formatDateTime(msg.created_at)}</td>
                <td>{msg.report_count}</td>
                <td>{msg.status}</td>
                <td>
                  <Link to={`/admin/topics/${msg.topic_id}`}>{msg.topic_name}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [editableStatus, setEditableStatus] = useState<User["status"]>("ACTIVE");
  const [editableWarningCount, setEditableWarningCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "comments" | "chats">("info");

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res = await axios.get<User>(`/api/admin/users/${userId}`);
      setUser(res.data);
      setEditableStatus(res.data.status);
      setEditableWarningCount(res.data.warning_count);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("사용자 정보를 불러오는 데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await axios.patch(`/api/admin/users/${userId}`, {
        status: editableStatus,
        warning_count: editableWarningCount,
      });
      toast.success("사용자 정보가 성공적으로 업데이트되었습니다.");
      fetchData();
    } catch (err) {
      console.error("Error saving user data:", err);
      toast.error("정보 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderTabContent = () => {
    if (!userId) return null;
    switch (activeTab) {
      case "comments":
        return <UserComments userId={userId} />;
      case "chats":
        return <UserChats userId={userId} />;
      case "info":
      default:
        return (
          <div className="user-detail-card">
            <div className="user-detail-header">
              <h3>{user?.nickname}</h3>
              <span>가입일: {formatDateTime(user?.created_at)}</span>
            </div>
            <div className="user-detail-body">
              <div className="detail-item">
                <span className="item-label">프로필 이미지</span>
                <span className="item-value">
                  {user?.profile_image_url ? (
                    <img src={user.profile_image_url} alt={`${user.nickname} 프로필`} style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
                  ) : (
                    "없음"
                  )}
                </span>
              </div>
              <div className="detail-item">
                <span className="item-label">고유 ID</span>
                <span className="item-value">{user?.id}</span>
              </div>
              <div className="detail-item">
                <span className="item-label">이름</span>
                <span className="item-value">{user?.name || "-"}</span>
              </div>
              <div className="detail-item">
                <span className="item-label">닉네임</span>
                <span className="item-value">{user?.nickname}</span>
              </div>
              <div className="detail-item">
                <span className="item-label">이메일</span>
                <span className="item-value">{user?.email}</span>
              </div>
              <div className="detail-item">
                <span className="item-label">전화번호</span>
                <span className="item-value">{user?.phone || "-"}</span>
              </div>
              <div className="detail-item">
                <span className="item-label">소개</span>
                <span className="item-value">{user?.introduction || "-"}</span>
              </div>
              <div className="detail-item editable">
                <label htmlFor="status" className="item-label">계정 상태</label>
                <select
                  id="status"
                  className="item-input"
                  value={editableStatus}
                  onChange={(e) => setEditableStatus(e.target.value as User["status"])}
                >
                  <option value="ACTIVE">활성</option>
                  <option value="SUSPENDED">정지</option>
                </select>
              </div>
              <div className="detail-item editable">
                <label htmlFor="warning_count" className="item-label">경고 횟수</label>
                <input
                  id="warning_count"
                  type="number"
                  className="item-input"
                  value={editableWarningCount}
                  onChange={(e) => setEditableWarningCount(parseInt(e.target.value, 10))}
                  min="0"
                />
              </div>
            </div>
            <div className="user-detail-footer">
              <button onClick={handleSaveChanges} className="save-btn" disabled={isSaving}>
                {isSaving ? "저장 중..." : "변경사항 저장"}
              </button>
            </div>
          </div>
        );
    }
  };

  if (isLoading) {
    return <div className="admin-container">로딩 중...</div>;
  }

  if (error) {
    return <div className="admin-container">{error}</div>;
  }

  if (!user) {
    return <div className="admin-container">사용자를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="admin-container">
      <header className="admin-page-header">
        <h1>사용자 상세 정보</h1>
        <Link to="/admin/users" className="back-link">
          ← 전체 사용자 목록으로
        </Link>
      </header>

      <div className="admin-tabs">
        <button onClick={() => setActiveTab("info")} className={activeTab === "info" ? "active" : ""}>기본 정보</button>
        <button onClick={() => setActiveTab("comments")} className={activeTab === "comments" ? "active" : ""}>작성 댓글</button>
        <button onClick={() => setActiveTab("chats")} className={activeTab === "chats" ? "active" : ""}>채팅 내역</button>
      </div>

      <div className="admin-tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
}