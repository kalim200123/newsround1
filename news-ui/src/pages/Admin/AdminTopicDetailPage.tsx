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
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Modal from "../../components/Modal";
import type { Article, Topic } from "../../types";

const timeAgo = (dateString?: string): string => {
  if (!dateString) return "";
  const source = new Date(dateString);
  if (Number.isNaN(source.getTime())) return "";

  const diffSeconds = Math.floor((Date.now() - source.getTime()) / 1000);
  if (diffSeconds < 60) return "방금 전";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}분 전`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}시간 전`;
  return source.toLocaleDateString("ko-KR");
};

interface SortableItemProps {
  article: Article;
  onFeature: (id: number) => void;
  onUnpublish: (id: number) => void;
  onPreview: (article: Article) => void;
}

const SortablePublishedArticleItem = ({ article, onFeature, onUnpublish, onPreview }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: article.id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none",
  };

  return (
    <div ref={setNodeRef} style={style} className={`curation-item published-item ${article.is_featured ? "featured-item" : ""}`}>
      <div {...attributes} {...listeners} style={{ cursor: "grab", flexGrow: 1 }} onClick={() => onPreview(article)}>
        <strong>{article.title}</strong>
        <br />
        <small>
          {article.source}
          {article.is_featured ? " · 대표" : ""}
        </small>
        <div className="article-meta-data">
          <span>유사도 {((article.similarity ?? 0) * 100).toFixed(1)}%</span>
          <span>{timeAgo(article.published_at)}</span>
        </div>
      </div>
      <div className="curation-actions">
        {!article.is_featured && (
          <button type="button" onClick={() => onFeature(article.id)} className="feature-btn">
            대표 지정
          </button>
        )}
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
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [publishedLeft, setPublishedLeft] = useState<Article[]>([]);
  const [publishedRight, setPublishedRight] = useState<Article[]>([]);
  const [topicList, setTopicList] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!topicId) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [topicRes, articlesRes] = await Promise.all([
        axios.get(`http://localhost:3000/api/topics/${topicId}`),
        axios.get(`http://localhost:3000/admin/topics/${topicId}/articles`),
      ]);

      setTopic(topicRes.data.topic);
      setAllArticles(articlesRes.data);
      setPublishedLeft(articlesRes.data.filter((article: Article) => article.status === "published" && article.side === "LEFT"));
      setPublishedRight(articlesRes.data.filter((article: Article) => article.status === "published" && article.side === "RIGHT"));
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
        const response = await axios.get(`http://localhost:3000/admin/topics/published`);
        setTopicList(response.data);
      } catch (error) {
        console.error("발행 토픽 목록을 불러오지 못했습니다.", error);
      }
    };

    fetchTopicList();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const buildManualTimeDefault = (value?: string): string => {
    if (!value) return "";
    return value.replace("T", " ").slice(0, 16);
  };

  const handlers = {
    handlePublishArticle: async (article: Article) => {
      const payload: { publishedAt?: string } = {};
      if (article.source_domain === "hani.co.kr") {
        const defaultValue = buildManualTimeDefault(article.published_at);
        const manualInput = window.prompt("한겨레 기사 발행 시각을 입력하세요 (예: 2024-05-24 14:30)", defaultValue);
        if (manualInput === null) {
          return;
        }
        const normalized = manualInput.trim();
        if (!normalized) {
          alert("발행 시각을 입력해야 합니다.");
          return;
        }
        const sanitized = normalized.replace(/\./g, "-").replace(/\//g, "-").replace("T", " ");
        const match = sanitized.match(/^(\d{4}-\d{2}-\d{2})\s(\d{2}):(\d{2})(?::(\d{2}))?$/);
        if (!match) {
          alert("발행 시각 형식이 올바르지 않습니다. 예: 2024-05-24 14:30");
          return;
        }
        const seconds = match[4] ?? "00";
        payload.publishedAt = `${match[1]} ${match[2]}:${match[3]}:${seconds}`;
      }

      try {
        await axios.patch(`http://localhost:3000/admin/articles/${article.id}/publish`, payload);
        alert("기사 발행이 완료되었습니다.");
        fetchData();
      } catch (error) {
        console.error(error);
        alert("기사 발행 중 오류가 발생했습니다.");
      }
    },
    handleUnpublishArticle: async (articleId: number) => {
      try {
        await axios.patch(`http://localhost:3000/admin/articles/${articleId}/unpublish`);
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
        await axios.patch(`http://localhost:3000/admin/articles/${articleId}/delete`);
        alert("후보 기사에서 삭제했습니다.");
        fetchData();
      } catch (error) {
        console.error(error);
        alert("후보 기사 삭제에 실패했습니다.");
      }
    },
    handleFeatureArticle: async (articleId: number) => {
      try {
        await axios.patch(`http://localhost:3000/admin/articles/${articleId}/feature`);
        alert("대표 기사로 지정했습니다.");
        fetchData();
      } catch (error) {
        console.error(error);
        alert("대표 기사 지정에 실패했습니다.");
      }
    },
    handleRecollect: async () => {
      if (!topicId || !topic) return;
      const currentKeywords = topic.search_keywords || "";
      const input = window.prompt("재수집에 사용할 검색 키워드를 입력하세요.\n(비워두면 기존 값을 유지합니다.)", currentKeywords);
      if (input === null) {
        return;
      }
      if (!window.confirm("토픽의 기사를 다시 수집할까요?")) return;
      const trimmed = input.trim();
      const payload: { searchKeywords?: string } = {};
      if (trimmed) {
        payload.searchKeywords = trimmed;
      }
      try {
        const response = await axios.post(`http://localhost:3000/admin/topics/${topicId}/recollect`, payload);
        if (payload.searchKeywords) {
          setTopic((prev) => (prev ? { ...prev, search_keywords: payload.searchKeywords } : prev));
        } else if (response.data?.searchKeywords) {
          setTopic((prev) => (prev ? { ...prev, search_keywords: response.data.searchKeywords } : prev));
        }
        alert("기사 재수집을 요청했습니다.");
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
        await axios.patch(`http://localhost:3000/admin/topics/${topicId}/articles/order`, { left, right });
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
        await axios.patch(`http://localhost:3000/admin/topics/${topicId}/archive`);
        alert("토픽을 보관 처리했습니다.");
        navigate("/admin");
      } catch (error) {
        console.error(error);
        alert("토픽 보관 처리에 실패했습니다.");
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

    if (publishedLeft.some((article) => article.id === active.id) && publishedLeft.some((article) => article.id === over.id)) {
      setPublishedLeft((items) =>
        arrayMove(
          items,
          items.findIndex((item) => item.id === active.id),
          items.findIndex((item) => item.id === over.id)
        )
      );
    }

    if (publishedRight.some((article) => article.id === active.id) && publishedRight.some((article) => article.id === over.id)) {
      setPublishedRight((items) =>
        arrayMove(
          items,
          items.findIndex((item) => item.id === active.id),
          items.findIndex((item) => item.id === over.id)
        )
      );
    }
  };

  const suggestedLeft = useMemo(
    () => allArticles.filter((article) => article.status === "suggested" && article.side === "LEFT"),
    [allArticles]
  );
  const suggestedRight = useMemo(
    () => allArticles.filter((article) => article.status === "suggested" && article.side === "RIGHT"),
    [allArticles]
  );

  const StatusIndicator = ({ status }: { status: string | null | undefined }) => {
    if (status === "collecting") return <div className="status-indicator collecting">현재 기사 수집 중입니다</div>;
    if (status === "completed") return <div className="status-indicator completed">최신 기사 수집이 완료되었습니다</div>;
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
        <h2 className="sidebar-title">발행된 토픽</h2>
        <ul className="sidebar-topic-list">
          {topicList.map((item) => (
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

        <h1>기사 큐레이션: {topic.display_name || topic.core_keyword}</h1>
        <div className="topic-main-actions">
          <button type="button" onClick={handlers.handleRecollect} className="recollect-btn">
            기사 재수집 요청
          </button>
          <button type="button" onClick={handlers.handleSaveOrder} className="save-btn">
            노출 순서 저장
          </button>
          <button type="button" onClick={handlers.handleArchiveTopic} className="delete-btn">
            토픽 보관 처리
          </button>
        </div>

        <StatusIndicator status={topic.collection_status} />
        {errorMessage && <div className="detail-error inline">{errorMessage}</div>}
        {isLoading && <div className="detail-loading inline">기사 목록을 업데이트 중입니다…</div>}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="curation-grid">
            <div className="curation-column">
              <h2>진보</h2>
              <hr />
              <h3>발행된 기사 ({publishedLeft.length}개)</h3>
              <SortableContext items={publishedLeft} strategy={verticalListSortingStrategy}>
                {publishedLeft.map((article) => (
                  <SortablePublishedArticleItem
                    key={article.id}
                    article={article}
                    onFeature={handlers.handleFeatureArticle}
                    onUnpublish={handlers.handleUnpublishArticle}
                    onPreview={setPreviewArticle}
                  />
                ))}
              </SortableContext>
              <h3 style={{ marginTop: 30 }}>후보 기사 ({suggestedLeft.length}개)</h3>
              {renderSuggestedArticleList(suggestedLeft)}
            </div>

            <div className="curation-column">
              <h2>보수</h2>
              <hr />
              <h3>발행된 기사 ({publishedRight.length}개)</h3>
              <SortableContext items={publishedRight} strategy={verticalListSortingStrategy}>
                {publishedRight.map((article) => (
                  <SortablePublishedArticleItem
                    key={article.id}
                    article={article}
                    onFeature={handlers.handleFeatureArticle}
                    onUnpublish={handlers.handleUnpublishArticle}
                    onPreview={setPreviewArticle}
                  />
                ))}
              </SortableContext>
              <h3 style={{ marginTop: 30 }}>후보 기사 ({suggestedRight.length}개)</h3>
              {renderSuggestedArticleList(suggestedRight)}
            </div>
          </div>
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
