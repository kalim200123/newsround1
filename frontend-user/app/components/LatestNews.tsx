import { Article } from "@/lib/types/article";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import Favicon from "./common/Favicon"; // Import Favicon

interface LatestNewsProps {
  articles: Article[];
}

export default function LatestNews({ articles }: LatestNewsProps) {
  if (articles.length === 0) {
    return <div className="text-center text-muted-foreground py-5">최신 뉴스가 없습니다.</div>;
  }

  return (
    <div className="h-full flex flex-col justify-around">
      {articles.map((article) => (
        <Link
          href={article.url.startsWith("http") ? article.url : `https://${article.source_domain}${article.url}`}
          key={article.id}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 px-1 py-0.5 rounded-md hover:bg-muted/50 transition-colors duration-150"
        >
          <div className="w-24 h-16 flex-shrink-0 relative">
            <Image
              src={article.thumbnail_url || "/placeholder.svg"}
              alt={article.title}
              fill
              className="object-cover rounded-md"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized={true}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{article.title}</h3>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {article.favicon_url && (
                <Favicon src={article.favicon_url} alt={`${article.source} favicon`} size={16} className="mr-1.5" />
              )}
              <span>{article.source}</span>
              <span className="mx-1.5">·</span>
              <span>{formatDistanceToNow(new Date(article.published_at), { addSuffix: true, locale: ko })}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
