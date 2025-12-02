import type { DragEndEvent } from "@dnd-kit/core";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import axios from "axios";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Modal from "../../components/Modal";
import type { Article, Topic } from "../../types";

const timeAgo = (dateString?: string): string => {
  if (!dateString) return "";
  const source = new Date(dateString.includes("Z") ? dateString : dateString + "Z");
  if (Number.isNaN(source.getTime())) return "";

  const diffSeconds = Math.floor((Date.now() - source.getTime()) / 1000);
  if (diffSeconds < 60) return "방금 전";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}분 전`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}시간 전`;
  return source.toLocaleDateString("ko-KR");
};

interface SortableItemProps {
  article: Article;
  onUnpublish: (id: number) => void;
  onPreview: (article: Article) => void;
}

const SortablePublishedArticleItem = ({ article, onUnpublish, onPreview }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: article.id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none",
  };

  return (
    <div ref={setNodeRef} style={style} className="curation-item published-item">
      <div {...attributes} {...listeners} style={{ cursor: "grab", flexGrow: 1 }} onClick={() => onPreview(article)}>
        <strong>{article.title}</strong>
        <br />
        <small>{article.source}</small>
        <div className="article-meta-data">
          <span>유사도 {((article.similarity ?? 0) * 100).toFixed(1)}%</span>
          <span>{timeAgo(article.published_at)}</span>
        </div>
      </div>
      <div className="curation-actions">
        <button type="button" onClick={() => onUnpublish(article.id)} className="unpublish-btn">
          발행 취소
        </button>
      </div>
    </div>
  );
};

const AdminTopicDetailPage = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [editData, setEditData] = useState<Partial<Topic>>({});
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [publishedLeft, setPublishedLeft] = useState<Article[]>([]);
  const [publishedRight, setPublishedRight] = useState<Article[]>([]);
  const [publishedCenter, setPublishedCenter] = useState<Article[]>([]);
  const [topicList, setTopicList] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<"LEFT" | "CENTER" | "RIGHT">("LEFT");
  const [sidebarTab, setSidebarTab] = useState<"OPEN" | "PREPARING">("OPEN");

  const fetchData = useCallback(async () => {
    if (!topicId) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [topicRes, articlesRes] = await Promise.all([
        axios.get(`/api/admin/topics/${topicId}`),
        axios.get(`/api/admin/topics/${topicId}/articles`),
      ]);

      const fetchedTopic = topicRes.data.topic;
      setTopic(fetchedTopic);
      setEditData({
        ...fetchedTopic,
        vote_start_at: buildHtmlDateTime(fetchedTopic.vote_start_at),
        vote_end_at: buildHtmlDateTime(fetchedTopic.vote_end_at),
      });

      setAllArticles(articlesRes.data);
      setPublishedLeft(
        articlesRes.data.filter((article: Article) => article.status === "published" && article.side === "LEFT")
      );
      setPublishedRight(
        articlesRes.data.filter((article: Article) => article.status === "published" && article.side === "RIGHT")
      );
      setPublishedCenter(
        articlesRes.data.filter((article: Article) => article.status === "published" && article.side === "CENTER")
      );
    } catch (error) {
      console.error("토픽 상세 데이터를 불러오지 못했습니다.", error);
      setErrorMessage("토픽 정보를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      setTopic(null);
    } finally {
      setIsLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    const fetchTopicList = async () => {
      try {
        const response = await axios.get(`/api/admin/topics/sidebar`);
        setTopicList(Array.isArray(response.data.topics) ? response.data.topics : []);
      } catch (error) {
        console.error("발행 토픽 목록을 불러오지 못했습니다.", error);
        setTopicList([]);
      }
    };

    fetchTopicList();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const buildHtmlDateTime = (isoString?: string | null) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    // Adjust for time zone offset
    const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const handleEditDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let value = e.target.value;

    // 투표 종료 시각은 항상 23:59:59로 고정
    if (e.target.name === "vote_end_at" && value) {
      const datePart = value.split("T")[0];
      value = `${datePart}T23:59:59`;
    }

    setEditData({ ...editData, [e.target.name]: value });
  };

  const handlers = {
    handlePublishTopic: async (e: React.FormEvent) => {
      e.preventDefault();
      if (!topicId || !editData) return;

      const { display_name, embedding_keywords, summary, stance_left, stance_right, vote_start_at, vote_end_at } =
        editData;

      if (!display_name || !embedding_keywords || !vote_start_at || !vote_end_at) {
        alert("토픽 주제, 키워드, 투표 시작/종료 시각은 필수입니다.");
        return;
      }

      try {
        await axios.patch(`/api/admin/topics/${topicId}/status`, {
          status: "OPEN",
          displayName: display_name,
          embeddingKeywords: embedding_keywords,
          summary: summary || "",
          stanceLeft: stance_left || "",
          stanceRight: stance_right || "",
          vote_start_at: vote_start_at,
          vote_end_at: vote_end_at,
        });
        alert("토픽이 성공적으로 발행되었습니다.");
        fetchData(); // Refresh data to show updated status
      } catch (error) {
        console.error("Error publishing topic:", error);
        alert("토픽 발행에 실패했습니다.");
      }
    },

    handlePublishArticle: async (article: Article) => {
      const payload: { publishedAt?: string } = {};
      if (article.source_domain === "hani.co.kr") {
        const defaultValue = buildHtmlDateTime(article.published_at);
        const manualInput = window.prompt("한겨레 기사 발행 시각을 입력하세요 (예: 2024-05-24 14:30)", defaultValue);
        if (manualInput === null) return;

        const normalized = manualInput.trim();
        if (!normalized) {
          alert("발행 시각을 입력해야 합니다.");
          return;
        }
        payload.publishedAt = normalized;
      }

      try {
        await axios.patch(`/api/admin/articles/${article.id}/publish`, payload);
        alert("기사 발행이 완료되었습니다.");
        fetchData();
      } catch (error) {
        console.error(error);
        alert("기사 발행 중 오류가 발생했습니다.");
      }
    },
    handleUnpublishArticle: async (articleId: number) => {
      try {
        await axios.patch(`/api/admin/articles/${articleId}/unpublish`);
        alert("기사 발행이 취소되었습니다.");
        fetchData();
      } catch (error) {
        console.error(error);
        alert("기사 발행 취소에 실패했습니다.");
      }
    },
    handleDeleteArticle: async (articleId: number) => {
      if (!window.confirm("이 기사를 후보 목록에서 삭제할까요?")) return;
      try {
        await axios.patch(`/api/admin/articles/${articleId}/delete`);
        alert("후보 기사에서 삭제했습니다.");
        fetchData();
      } catch (error) {
        console.error(error);
        alert("후보 기사 삭제에 실패했습니다.");
      }
    },
    handleRecollect: async () => {
      if (!topicId || !topic) return;
      const currentKeywords = topic.embedding_keywords || "";
      const input = window.prompt(
        "기사 재수집에 사용할 검색 키워드를 입력하세요.\n(비워두면 기존 값을 유지합니다.)",
        currentKeywords
      );
      if (input === null) return;

      const trimmed = input.trim();
      const payload: { embeddingKeywords?: string } = {};
      if (trimmed) {
        payload.embeddingKeywords = trimmed;
      }
      try {
        const response = await axios.post(`/api/admin/topics/${topicId}/recollect`, payload);
        if (payload.embeddingKeywords) {
          setTopic((prev) => (prev ? { ...prev, embedding_keywords: payload.embeddingKeywords } : prev));
        } else if (response.data?.searchKeywords) {
          setTopic((prev) => (prev ? { ...prev, embedding_keywords: response.data.searchKeywords } : prev));
        }
        alert("기사 재수집을 요청했습니다. 잠시 후 새로고침하여 확인해주세요.");
      } catch (error) {
        console.error(error);
        alert("기사 재수집 요청에 실패했습니다.");
      }
    },
    handleSaveOrder: async () => {
      if (!topicId) return;
      try {
        const left = publishedLeft.map((article) => article.id);
        const right = publishedRight.map((article) => article.id);
        const center = publishedCenter.map((article) => article.id);
        await axios.patch(`/api/admin/topics/${topicId}/articles/order`, { left, right, center });
        alert("기사 노출 순서를 저장했습니다.");
      } catch (error) {
        console.error(error);
        alert("노출 순서 저장에 실패했습니다.");
      }
    },
    handleArchiveTopic: async () => {
      if (!topicId) return;
      if (!window.confirm("이 토픽을 보관 처리할까요? (사용자 화면에서 숨겨집니다)")) return;
      try {
        await axios.patch(`/api/admin/topics/${topicId}/status`, { status: "CLOSED" });
        alert("토픽을 보관 처리했습니다.");
        navigate("/admin/topics");
      } catch (error) {
        console.error(error);
        alert("토픽 보관 처리에 실패했습니다.");
      }
    },
    handleUnpublishAllArticles: async () => {
      if (!topicId) return;
      if (!window.confirm(`이 토픽의 모든 발행된 기사를 '제안됨' 상태로 변경할까요?`)) return;
      try {
        const response = await axios.post(`/api/admin/topics/${topicId}/unpublish-all-articles`);
        const count = response.data.updatedCount || 0;
        alert(`${count}개의 기사가 '제안됨' 상태로 변경되었습니다.`);
        fetchData(); // 데이터 새로고침
      } catch (error) {
        console.error("모든 기사 발행 취소 실패:", error);
        alert("작업에 실패했습니다. 서버 로그를 확인해주세요.");
      }
    },
    handleDeleteAllSuggested: async () => {
      if (!topicId) return;
      if (!window.confirm(`이 토픽의 모든 후보 기사(제안됨 상태)를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return;
      try {
        const response = await axios.post(`/api/admin/topics/${topicId}/delete-all-suggested`);
        const count = response.data.deletedCount || 0;
        alert(`${count}개의 후보 기사가 삭제 처리되었습니다.`);
        fetchData(); // 데이터 새로고침
      } catch (error) {
        console.error("모든 후보 기사 삭제 실패:", error);
        alert("작업에 실패했습니다. 서버 로그를 확인해주세요.");
      }
    },
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const moveItem = (items: Article[], setItems: React.Dispatch<React.SetStateAction<Article[]>>): boolean => {
      const activeIndex = items.findIndex((item) => item.id === active.id);
      const overIndex = items.findIndex((item) => item.id === over.id);

      if (activeIndex !== -1 && overIndex !== -1) {
        setItems((prevItems) => arrayMove(prevItems, activeIndex, overIndex));
        return true;
      }
      return false;
    };

    if (moveItem(publishedLeft, setPublishedLeft)) return;
    if (moveItem(publishedRight, setPublishedRight)) return;
    if (moveItem(publishedCenter, setPublishedCenter)) return;
  };

  const suggestedLeft = useMemo(
    () => allArticles.filter((article) => article.status === "suggested" && article.side === "LEFT"),
    [allArticles]
  );
  const suggestedRight = useMemo(
    () => allArticles.filter((article) => article.status === "suggested" && article.side === "RIGHT"),
    [allArticles]
  );
  const suggestedCenter = useMemo(
    () => allArticles.filter((article) => article.status === "suggested" && article.side === "CENTER"),
    [allArticles]
  );

  const StatusIndicator = ({ status }: { status: string | null | undefined }) => {
    if (status === "pending") return <div className="status-indicator pending">수집 대기 중</div>;
    if (status === "collecting") return <div className="status-indicator collecting">현재 기사 수집 중입니다</div>;
    if (status === "completed")
      return <div className="status-indicator completed">최신 기사 수집이 완료되었습니다</div>;
    if (status === "failed") return <div className="status-indicator failed">기사 수집이 실패했습니다</div>;
    return null;
  };

  const renderSuggestedArticleList = (articles: Article[]) =>
    articles.map((article) => (
      <div key={article.id} className="curation-item">
        <div
          className="article-title-section"
          role="button"
          tabIndex={0}
          onClick={() => setPreviewArticle(article)}
          onKeyDown={(event) => event.key === "Enter" && setPreviewArticle(article)}
        >
          <strong>{article.title}</strong>
          <br />
          <small>{article.source}</small>
          <div className="article-meta-data">
            <span>유사도 {((article.similarity ?? 0) * 100).toFixed(1)}%</span>
            <span>{timeAgo(article.published_at)}</span>
          </div>
        </div>
        <div className="curation-actions">
          <button type="button" onClick={() => handlers.handlePublishArticle(article)} className="publish-btn">
            발행
          </button>
          <button type="button" onClick={() => handlers.handleDeleteArticle(article.id)} className="delete-btn">
            삭제
          </button>
        </div>
      </div>
    ));

  const renderCurationColumn = (
    side: "LEFT" | "CENTER" | "RIGHT",
    publishedArticles: Article[],
    suggestedArticles: Article[]
  ) => {
    let title = "";
    if (side === "LEFT") title = "진보";
    if (side === "CENTER") title = "중도";
    if (side === "RIGHT") title = "보수";

    return (
      <div className="curation-column">
        <h2>{title}</h2>
        <hr />
        <h3>발행된 기사 ({publishedArticles.length}개)</h3>
        <SortableContext items={publishedArticles} strategy={verticalListSortingStrategy}>
          {publishedArticles.map((article) => (
            <SortablePublishedArticleItem
              key={article.id}
              article={article}
              onUnpublish={handlers.handleUnpublishArticle}
              onPreview={setPreviewArticle}
            />
          ))}
        </SortableContext>
        <h3 style={{ marginTop: 30 }}>후보 기사 ({suggestedArticles.length}개)</h3>
        {renderSuggestedArticleList(suggestedArticles)}
      </div>
    );
  };

  if (!topic) {
    return (
      <div className="admin-container curation-page-layout">
        <div className="detail-loading">토픽 정보를 불러오는 중입니다…</div>
        {errorMessage && <div className="detail-error">{errorMessage}</div>}
      </div>
    );
  }

  return (
    <div className="admin-container curation-page-layout">
      <aside className="curation-sidebar">
        <h2 className="sidebar-title">토픽 목록</h2>
        <div className="filter-tabs" style={{ marginBottom: "16px", gap: "8px" }}>
          <button
            type="button"
            className={`filter-tab ${sidebarTab === "OPEN" ? "active" : ""}`}
            onClick={() => setSidebarTab("OPEN")}
            style={{ fontSize: "0.8rem", padding: "6px 12px" }}
          >
            발행됨
          </button>
          <button
            type="button"
            className={`filter-tab ${sidebarTab === "PREPARING" ? "active" : ""}`}
            onClick={() => setSidebarTab("PREPARING")}
            style={{ fontSize: "0.8rem", padding: "6px 12px" }}
          >
            준비 중
          </button>
        </div>
        <ul className="sidebar-topic-list">
          {topicList
            .filter((item) => item.status === sidebarTab)
            .map((item) => (
              <li key={item.id}>
                <Link
                  to={`/admin/topics/${item.id}`}
                  className={item.id === Number(topicId) ? "sidebar-topic-item active" : "sidebar-topic-item"}
                >
                  {item.display_name || item.core_keyword}
                </Link>
              </li>
            ))}
        </ul>
      </aside>

      <main className="curation-main-content">
        <Link to="/admin" className="back-link">
          ← 관리자 목록으로 돌아가기
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <h1>기사 큐레이션: {topic.display_name || topic.core_keyword}</h1>
          <StatusIndicator status={topic.collection_status} />
        </div>

        {topic.status === "PREPARING" && (
          <section className="topic-publish-section">
            <h2>토픽 발행 설정</h2>
            <form onSubmit={handlers.handlePublishTopic} className="topic-edit-form">
              <div className="edit-field">
                <label htmlFor="display_name">토픽 주제</label>
                <input
                  type="text"
                  name="display_name"
                  value={editData.display_name || ""}
                  onChange={handleEditDataChange}
                  required
                />
              </div>
              <div className="edit-field">
                <label htmlFor="embedding_keywords">임베딩 키워드 (쉼표로 구분)</label>
                <input
                  type="text"
                  name="embedding_keywords"
                  value={editData.embedding_keywords || ""}
                  onChange={handleEditDataChange}
                  required
                />
              </div>
              <div className="edit-field">
                <label htmlFor="stance_left">LEFT 주장</label>
                <input
                  type="text"
                  name="stance_left"
                  value={editData.stance_left || ""}
                  onChange={handleEditDataChange}
                />
              </div>
              <div className="edit-field">
                <label htmlFor="stance_right">RIGHT 주장</label>
                <input
                  type="text"
                  name="stance_right"
                  value={editData.stance_right || ""}
                  onChange={handleEditDataChange}
                />
              </div>
              <div className="edit-field">
                <label htmlFor="summary">토픽 요약</label>
                <textarea
                  name="summary"
                  value={editData.summary || ""}
                  onChange={handleEditDataChange}
                  rows={3}
                ></textarea>
              </div>
              <div className="edit-field-row">
                <div className="edit-field">
                  <label htmlFor="vote_start_at">투표 시작 시각</label>
                  <input
                    type="datetime-local"
                    name="vote_start_at"
                    value={editData.vote_start_at || ""}
                    onChange={handleEditDataChange}
                    required
                  />
                </div>
                <div className="edit-field">
                  <label htmlFor="vote_end_at">투표 종료 시각</label>
                  <input
                    type="datetime-local"
                    name="vote_end_at"
                    value={editData.vote_end_at || ""}
                    onChange={handleEditDataChange}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="publish-topic-btn">
                토픽 발행하기
              </button>
            </form>
          </section>
        )}

        <div className="topic-main-actions">
          <button type="button" onClick={handlers.handleRecollect} className="recollect-btn">
            기사 재수집
          </button>
          <button type="button" onClick={handlers.handleSaveOrder} className="save-btn">
            노출 순서 저장
          </button>
          {topic.status === "OPEN" && (
            <button type="button" onClick={handlers.handleArchiveTopic} className="delete-btn">
              토픽 보관 처리
            </button>
          )}
          <button type="button" onClick={handlers.handleUnpublishAllArticles} className="delete-btn">
            모든 기사 발행 취소
          </button>
          <button type="button" onClick={handlers.handleDeleteAllSuggested} className="delete-btn">
            모든 후보 기사 삭제
          </button>
        </div>

        {errorMessage && <div className="detail-error inline">{errorMessage}</div>}
        {isLoading && <div className="detail-loading inline">기사 목록을 업데이트 중입니다…</div>}

        <div className="filter-tabs" style={{ marginBottom: "24px" }}>
          <button
            type="button"
            className={`filter-tab ${activeSide === "LEFT" ? "active" : ""}`}
            onClick={() => setActiveSide("LEFT")}
          >
            진보
          </button>
          <button
            type="button"
            className={`filter-tab ${activeSide === "CENTER" ? "active" : ""}`}
            onClick={() => setActiveSide("CENTER")}
          >
            중도
          </button>
          <button
            type="button"
            className={`filter-tab ${activeSide === "RIGHT" ? "active" : ""}`}
            onClick={() => setActiveSide("RIGHT")}
          >
            보수
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {activeSide === "LEFT" && renderCurationColumn("LEFT", publishedLeft, suggestedLeft)}
          {activeSide === "CENTER" && renderCurationColumn("CENTER", publishedCenter, suggestedCenter)}
          {activeSide === "RIGHT" && renderCurationColumn("RIGHT", publishedRight, suggestedRight)}
        </DndContext>
      </main>

      <Modal isOpen={Boolean(previewArticle)} onClose={() => setPreviewArticle(null)}>
        {previewArticle && (
          <div className="article-preview-modal">
            <h2>{previewArticle.title}</h2>
            <p>
              <strong>출처:</strong> {previewArticle.source}
            </p>
            {previewArticle.thumbnail_url && (
              <img src={previewArticle.thumbnail_url} alt="기사 썸네일" className="preview-thumbnail" />
            )}
            <p className="preview-summary">{previewArticle.rss_desc || "요약 정보가 제공되지 않았습니다."}</p>
            <a href={previewArticle.url} target="_blank" rel="noopener noreferrer" className="preview-link">
              원문 기사 보기
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminTopicDetailPage;
