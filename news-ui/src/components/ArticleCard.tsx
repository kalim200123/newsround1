import { FAVICON_URLS } from "../constants/favicons";
import type { Article } from "../types";

interface ArticleCardProps {
  article: Article;
  isFeatured?: boolean;
}

const timeAgo = (dateString?: string): string => {
  if (!dateString) {
    return "";
  }
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) {
    return "";
  }
  const diffInSeconds = Math.floor((Date.now() - target.getTime()) / 1000);
  if (diffInSeconds < 60) {
    return "방금 전";
  }
  if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}분 전`;
  }
  if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  }
  return target.toLocaleDateString("ko-KR");
};

const ArticleCard = ({ article, isFeatured = false }: ArticleCardProps) => {
  const faviconUrl = article.source_domain ? FAVICON_URLS[article.source_domain] : "";

  if (isFeatured) {
    return (
      <a href={article.url} target="_blank" rel="noopener noreferrer" className="article-card-link featured-article">
        <div className="featured-thumbnail">
          {article.thumbnail_url ? (
            <img src={article.thumbnail_url} alt={article.title} />
          ) : (
            <div className="thumbnail-placeholder">썸네일 없음</div>
          )}
        </div>
        <div className="article-content">
          <div className="article-card-source">
            {faviconUrl && <img src={faviconUrl} alt={article.source} className="favicon-img" />}
            <span>{article.source}</span>
          </div>
          <h3 className="article-card-title">{article.title}</h3>
          <small className="article-card-time">{timeAgo(article.published_at)}</small>
        </div>
      </a>
    );
  }

  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer" className="article-card-link regular-article">
      <div className="article-content">
        <div className="article-card-source">
          {faviconUrl && <img src={faviconUrl} alt={article.source} className="favicon-img" />}
          <span>{article.source}</span>
        </div>
        <h4 className="article-card-title">{article.title}</h4>
        <small className="article-card-time">{timeAgo(article.published_at)}</small>
      </div>
    </a>
  );
};

export default ArticleCard;
