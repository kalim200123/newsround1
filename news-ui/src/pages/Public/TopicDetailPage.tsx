import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ArticleGrid from "../../components/ArticleGrid";
import Sidebar from "../../components/Sidebar";
import Comments from "../../components/Comments";
import type { Article, Topic } from "../../types";

const formatDate = (value?: string | null) => {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${parsed.getFullYear()}.${month}.${day}`;
};

const TopicDetailPage = () => {
  const { topicId } = useParams();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTopicDetails = useCallback(async () => {
    if (!topicId) {
      setTopic(null);
      setArticles([]);
      setErrorMessage("유효하지 않은 토픽입니다.");
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await axios.get(`http://localhost:3000/api/topics/${topicId}`);
      setTopic(response.data.topic);
      setArticles(response.data.articles ?? []);
    } catch (error) {
      console.error("토픽 정보를 불러오는 중 오류가 발생했습니다.", error);
      setErrorMessage("토픽 정보를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    fetchTopicDetails();
  }, [fetchTopicDetails]);

  const displayName = topic?.display_name || topic?.core_keyword || "";

  useEffect(() => {
    const pageTitle = displayName ? `${displayName} | Different News` : "Different News";
    document.title = pageTitle;
    return () => {
      document.title = "Different News";
    };
  }, [displayName]);

  const { leftFeatured, leftRegular, rightFeatured, rightRegular } = useMemo(() => {
    const leftArticles = articles.filter((article) => article.side === "LEFT");
    const rightArticles = articles.filter((article) => article.side === "RIGHT");

    const pickFeatured = (list: Article[]) => list.find((article) => article.is_featured);
    const pickRegular = (list: Article[]) => list.filter((article) => !article.is_featured);

    return {
      leftFeatured: pickFeatured(leftArticles),
      leftRegular: pickRegular(leftArticles),
      rightFeatured: pickFeatured(rightArticles),
      rightRegular: pickRegular(rightArticles),
    };
  }, [articles]);

  if (isLoading && !topic) {
    return (
      <div className="detail-page-container">
        <div className="detail-loading">콘텐츠를 불러오는 중입니다…</div>
      </div>
    );
  }

  if (errorMessage && !topic) {
    return (
      <div className="detail-page-container">
        <div className="detail-error">
          <p>{errorMessage}</p>
          <button type="button" onClick={fetchTopicDetails} className="retry-btn">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!topic) {
    return null;
  }

  const summaryText = topic.summary?.trim() || "이 토픽에 대한 요약이 준비되는 중입니다.";
  const publishedLabel = topic.published_at ? `${formatDate(topic.published_at)} 발행` : "발행 정보 없음";
  const hasArticles = articles.length > 0;
  const headingText = displayName || "Different News";

  return (
    <div className="detail-page-container">
      <div className="page-header">
        <Link to="/" className="back-to-list-button">
          전체 토픽 목록 보기
        </Link>
      </div>

      <header className="topic-header">
        <div className="topic-header-meta">
          <span className="topic-published-label">{publishedLabel}</span>
          {isLoading && <span className="topic-refreshing">업데이트 중…</span>}
        </div>
        <h1>{headingText}</h1>
        <p className="topic-summary">{summaryText}</p>
      </header>

      {errorMessage && (
        <div className="detail-error inline">
          <p>{errorMessage}</p>
          <button type="button" onClick={fetchTopicDetails} className="retry-btn">
            다시 불러오기
          </button>
        </div>
      )}

      <div className="detail-page-body">
        <Sidebar />
        <main className="articles-grid-container">
          {hasArticles ? (
            <>
              <ArticleGrid side="진보" featuredArticle={leftFeatured} regularArticles={leftRegular} />
              <ArticleGrid side="보수" featuredArticle={rightFeatured} regularArticles={rightRegular} />
            </>
          ) : (
            <div className="article-empty-state">준비된 기사가 없습니다. 잠시 후 다시 확인해 주세요.</div>
          )}
        </main>
      </div>

      <section className="comments-section">
        {topicId && <Comments topicId={topicId} />}
      </section>
    </div>
  );
};

export default TopicDetailPage;
