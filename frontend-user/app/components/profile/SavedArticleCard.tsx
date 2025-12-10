import { getCategoryTheme } from "@/lib/categoryColors";
import { SavedArticle } from "@/lib/types/article";
import { SavedArticleCategory } from "@/lib/types/shared";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Check, Folder, MoreHorizontal, Tag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Favicon from "../common/Favicon";

interface SavedArticleCardProps {
  article: SavedArticle;
  categories: SavedArticleCategory[];
  onMove: (article: SavedArticle, categoryId: number | null) => void;
  onUnsave: (article: SavedArticle) => void;
}

export default function SavedArticleCard({ article, categories, onMove, onUnsave }: SavedArticleCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const currentCategoryName = categories.find((c) => c.id === article.category_id)?.name;
  const categoryTheme = getCategoryTheme(article.category || "default");
  const hoverAccentClasses = categoryTheme.hoverText;
  const hoverBorderClasses = categoryTheme.hoverBorder;

  const commonClasses = cn(
    "group relative flex flex-col h-full bg-card rounded-xl overflow-hidden border border-border transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px] hover:border-primary",
    hoverBorderClasses
  );

  return (
    <div className={commonClasses}>
      <Link
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative w-full aspect-video overflow-hidden rounded-t-xl"
      >
        <Image
          src={article.thumbnail_url || "/placeholder.png"}
          alt={article.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized
        />
      </Link>

      <div className="p-4 flex flex-col grow">
        <Link href={article.url} target="_blank" rel="noopener noreferrer">
          <h3
            className={cn("font-bold text-base leading-tight mb-2 line-clamp-2 transition-colors", hoverAccentClasses)}
          >
            {article.title}
          </h3>
        </Link>
        <div className="flex items-center text-xs text-muted-foreground mb-3">
          <span className="line-clamp-3">{article.summary || article.description}</span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
          <div className="flex items-center text-xs text-muted-foreground">
            <Favicon src={article.favicon_url || ""} alt={article.source} size={12} className="mr-1" />
            <span className="mr-2">{article.source}</span>
            <span suppressHydrationWarning>{formatRelativeTime(article.published_at)}</span>
          </div>

          <div ref={menuRef} className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-1.5 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>

            {isMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-56 bg-popover border border-border rounded-lg shadow-xl z-10 p-2">
                <p className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">카테고리 이동</p>
                <div className="max-h-40 overflow-y-auto">
                  <button
                    onClick={() => {
                      onMove(article, null);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent"
                  >
                    <Folder size={14} />
                    <span className="flex-1">미분류</span>
                    {article.category_id === null && <Check size={16} className="text-primary" />}
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        onMove(article, cat.id);
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent"
                    >
                      <Tag size={14} />
                      <span className="flex-1 truncate">{cat.name}</span>
                      {article.category_id === cat.id && <Check size={16} className="text-primary" />}
                    </button>
                  ))}
                </div>
                <div className="border-t border-border my-2"></div>
                <button
                  onClick={() => {
                    onUnsave(article);
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-md text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={14} />
                  <span>저장 취소</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Current Folder Indicator */}
        {currentCategoryName && (
          <div className="absolute top-2 right-2 z-10">
            <span className="px-2 py-1 text-xs font-medium bg-black/60 text-white backdrop-blur-md rounded-md flex items-center gap-1">
              <Tag size={10} />
              {currentCategoryName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
