"use client";

import { useAuth } from "@/app/context/AuthContext";
import { toggleArticleSave } from "@/lib/api/articles";
import { getCategoryTheme } from "@/lib/categoryColors";
import { Article } from "@/lib/types/article";
import { cn } from "@/lib/utils";
import { Eye, MessageSquare } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ArticleSaveButton from "./ArticleSaveButton";
import ClientOnlyTime from "./common/ClientOnlyTime";
import Favicon from "./common/Favicon";
import StyledArticleTitle from "./common/StyledArticleTitle";

interface ArticleCardProps {
  article: Article;
  variant?: "hero" | "standard" | "horizontal" | "compact" | "overlay" | "chat" | "glass" | "text-only";
  onSaveToggle?: (article: Article) => void;
  onCommentIconClick?: (article: Article) => void;
  className?: string;
  priority?: boolean;
  hoverColorClass?: string;
  rel?: string; // Add rel prop for link relations
  hideImage?: boolean;
  customHoverColor?: string; // Add this prop
}

export default function ArticleCard({
  article,
  variant = "standard",
  onSaveToggle,
  onCommentIconClick,
  className = "",
  priority = false, // Default to false
  hoverColorClass, // No default, will be determined below
  rel = "noopener noreferrer", // Default rel to noopener noreferrer
  hideImage = false,
  customHoverColor, // Add this
}: ArticleCardProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const { title, summary, thumbnail_url, source, url, published_at, view_count, favicon_url } = article;

  // Determine hover colors dynamically
  let finalHoverColorClass = hoverColorClass;

  if (customHoverColor) {
    // Use customHoverColor if provided
    finalHoverColorClass = `group-hover:text-${customHoverColor}-500`;
  } else if (!finalHoverColorClass && article.category) {
    const theme = getCategoryTheme(article.category);
    finalHoverColorClass = theme.hoverText;
  } else if (!finalHoverColorClass) {
    finalHoverColorClass = "group-hover:text-primary"; // Default if no specific hover color class or category
  }

  // Common hover and transition classes

  const cardBaseClasses =
    "group relative overflow-hidden rounded-xl bg-card border border-border/50 transition-all duration-300 hover:shadow-lg hover:border-primary/20";

  const handleCommentClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (onCommentIconClick) {
      onCommentIconClick(article);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ type: "article", ...article }));
    e.dataTransfer.effectAllowed = "copy";
  };

  const [isSaved, setIsSaved] = useState(article.isSaved || false);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent link click

    if (isLoading) return;

    if (!token) {
      // Handle not logged in state - maybe redirect to login or show toast
      console.log("로그인이 필요합니다.");
      return;
    }

    setIsLoading(true);
    const articleType = article.articleType || "home"; // Default to 'home' if not specified

    try {
      await toggleArticleSave(token, article.id, isSaved, articleType);
      setIsSaved(!isSaved);
      if (onSaveToggle) onSaveToggle({ ...article, isSaved: !isSaved }); // Notify parent if needed
    } catch (error: unknown) {
      console.error("저장/취소 실패:", error);
      if (error instanceof Error) {
        if (error.message?.includes("409")) {
          console.log("이미 저장된 기사입니다.");
        } else if (error.message?.includes("404")) {
          console.log("기사를 찾을 수 없습니다.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Variant: Hero (Large, Immersive) ---

  if (variant === "hero") {
    return (
      <Link
        href={url}
        target="_blank"
        rel={rel}
        className={cn(cardBaseClasses, "block h-full min-h-[400px]", className)}
        draggable
        onDragStart={handleDragStart}
      >
        <div className="absolute inset-0">
          <Image
            src={thumbnail_url || "/placeholder.png"}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority={priority}
            sizes="(max-width: 768px) 100vw, 66vw"
            unoptimized
          />

          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col justify-end h-full">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/80 backdrop-blur-md rounded-full border border-white/10 shadow-sm">
              <Favicon src={favicon_url || ""} alt={source} size={14} className="rounded-full bg-white/10 p-0.5" />

              <span className="text-xs font-bold text-white">{source}</span>
            </div>

            {view_count && view_count > 1000 && (
              <span className="px-2 py-0.5 text-[10px] font-medium text-amber-300 bg-black/40 backdrop-blur-sm rounded-full border border-amber-500/30 flex items-center gap-1">
                <Eye size={10} /> {view_count.toLocaleString()}
              </span>
            )}
          </div>

          <StyledArticleTitle
            title={title}
            className={cn(
              "text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-3 drop-shadow-sm transition-colors",

              finalHoverColorClass
            )}
          />

          <p className="text-gray-200 text-sm md:text-base line-clamp-2 max-w-3xl mb-4 opacity-90">{summary}</p>

          <div className="flex items-center justify-between w-full mt-2">
            <ClientOnlyTime date={published_at} className="text-gray-300 text-xs" />

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
              {onCommentIconClick && (
                <button
                  onClick={handleCommentClick}
                  className="flex items-center gap-1 text-xs hover:text-white transition-colors"
                >
                  <MessageSquare size={14} />

                  <span>{article.comment_count ?? 0}</span>
                </button>
              )}

              {onSaveToggle && article.isSaved !== undefined && (
                <ArticleSaveButton isSaved={isSaved} onClick={handleSaveClick} />
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // --- Variant: Horizontal (List style) ---

  if (variant === "horizontal") {
    return (
      <Link
        href={url}
        target="_blank"
        rel={rel}
        className={cn(cardBaseClasses, "flex flex-row items-stretch h-32 md:h-40", className)}
        draggable
        onDragStart={handleDragStart}
      >
        {!hideImage && (
          <div className="relative w-1/3 md:w-48 shrink-0">
            <Image
              src={thumbnail_url || "/placeholder.png"}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="200px"
              unoptimized
            />
          </div>
        )}

        <div className="flex flex-col justify-between p-4 grow">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Favicon src={favicon_url || ""} alt={source} size={12} />

                <span className="text-xs font-medium text-primary/70">{source}</span>
              </div>

              <span className="text-[10px] text-muted-foreground">•</span>

              <ClientOnlyTime date={published_at} className="text-[10px] text-muted-foreground" />
            </div>

            <StyledArticleTitle
              title={title}
              className={cn(
                "font-bold text-base md:text-lg leading-snug line-clamp-2 transition-colors",

                finalHoverColorClass
              )}
            />
          </div>

          <p className="text-xs text-muted-foreground line-clamp-1 hidden md:block mt-1">{summary}</p>
        </div>
      </Link>
    );
  }

  // --- Variant: Text Only (Minimal) ---

  if (variant === "text-only") {
    return (
      <Link
        href={url}
        target="_blank"
        rel={rel}
        className={cn("block group py-3 border-b border-border/40 last:border-0", className)}
        draggable
        onDragStart={handleDragStart}
      >
        <div className="flex items-start justify-between gap-4">
          <StyledArticleTitle
            title={title}
            className={cn(
              "font-medium text-sm md:text-base leading-snug line-clamp-2 transition-colors",
              finalHoverColorClass
            )}
          />
        </div>

        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex items-center gap-1.5">
            <Favicon src={favicon_url || ""} alt={source} size={12} />

            <span className="text-xs text-muted-foreground">{source}</span>
          </div>

          <span className="text-[10px] text-muted-foreground/50">•</span>

          <ClientOnlyTime date={published_at} className="text-[10px] text-muted-foreground/50" />
        </div>
      </Link>
    );
  }

  // --- Variant: Compact (For Bento Grid side items) ---
  if (variant === "compact") {
    return (
      <Link
        href={url}
        target="_blank"
        rel={rel}
        className={cn(cardBaseClasses, "flex flex-col h-full", className)}
        draggable
        onDragStart={handleDragStart}
      >
        <div className="relative w-full aspect-video overflow-hidden">
          <Image
            src={thumbnail_url || "/placeholder.png"}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
        </div>
        <div className="flex flex-col grow p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Favicon src={favicon_url || ""} alt={source} size={12} />
            <span className="text-xs font-bold text-primary/80">{source}</span>
          </div>
          <StyledArticleTitle
            title={title}
            className={cn("font-bold text-sm leading-snug line-clamp-2 mb-2 transition-colors", finalHoverColorClass)}
          />
          <div className="mt-auto pt-2 flex items-center justify-between border-t border-border/30">
            <ClientOnlyTime date={published_at} className="text-[10px] text-muted-foreground" />
            {onSaveToggle && article.isSaved !== undefined && (
              <ArticleSaveButton isSaved={isSaved} onClick={handleSaveClick} />
            )}
          </div>
        </div>
      </Link>
    );
  }

  // --- Variant: Overlay (Image Background, Text Overlay) ---
  if (variant === "overlay") {
    return (
      <Link
        href={article.url}
        target="_blank"
        rel={rel}
        className={`group relative block w-full aspect-4/5 overflow-hidden rounded-xl ${className}`}
        draggable
        onDragStart={handleDragStart}
      >
        <Image
          src={article.thumbnail_url || "/placeholder.png"}
          alt={article.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 300px"
          unoptimized
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent p-4 flex flex-col justify-end">
          <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <span className="inline-block px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded mb-2">
              {article.source}
            </span>
            <StyledArticleTitle
              title={article.title}
              className="text-white font-bold text-lg leading-tight mb-1 line-clamp-2 group-hover:text-red-400 transition-colors"
            />
            <div className="flex gap-3 text-white/70 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
              <ClientOnlyTime date={article.published_at} />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // --- Variant: Glass (Overlay style, good for featured but smaller than hero) ---
  if (variant === "glass") {
    return (
      <Link
        href={url}
        target="_blank"
        rel={rel}
        className={cn(cardBaseClasses, "block h-full min-h-[250px]", className)}
        draggable
        onDragStart={handleDragStart}
      >
        <Image
          src={thumbnail_url || "/placeholder.png"}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        <div className="absolute bottom-4 left-4 right-4 glass-panel p-4 rounded-lg border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Favicon src={favicon_url || ""} alt={source} size={12} />
            <span className="text-xs font-semibold text-foreground/80">{source}</span>
          </div>
          <StyledArticleTitle
            title={title}
            className={cn("font-bold text-lg leading-snug line-clamp-2 mb-1 transition-colors", finalHoverColorClass)}
          />
        </div>
      </Link>
    );
  }

  // --- Variant: Chat (Compact Image Left, Title Right) ---
  if (variant === "chat") {
    return (
      <Link
        href={article.url}
        target="_blank"
        rel={rel}
        className={`group flex items-center rounded-lg ${
          isDarkMode ? "border border-gray-800 bg-black text-white" : "border border-gray-200 bg-white text-black"
        } transition-colors ${className}`}
        draggable
        onDragStart={handleDragStart}
      >
        <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-l-lg">
          <Image
            src={article.thumbnail_url || "/placeholder.png"}
            alt={title}
            fill
            className="object-cover"
            sizes="64px"
            unoptimized
          />
        </div>
        <div className="flex flex-col grow min-w-0 p-2">
          <StyledArticleTitle title={title} className={`font-semibold text-sm leading-tight line-clamp-2`} />
          <div className="flex items-center text-xs text-gray-300 mt-1">
            {favicon_url && <Favicon src={favicon_url} alt={`${source} favicon`} size={12} />}
            <span className="font-medium ml-1">{source}</span>
          </div>
        </div>
      </Link>
    );
  }

  // --- Variant: Standard (Default vertical card) ---
  return (
    <Link
      href={url}
      target="_blank"
      rel={rel}
      className={cn(cardBaseClasses, "flex flex-col h-full", className)}
      draggable
      onDragStart={handleDragStart}
    >
      <div className="relative w-full aspect-video overflow-hidden">
        <Image
          src={thumbnail_url || "/placeholder.png"}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized
        />
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold bg-background/90 backdrop-blur text-foreground rounded shadow-sm">
            <Favicon src={favicon_url || ""} alt={source} size={12} />
            {source}
          </div>
        </div>
      </div>

      <div className="flex flex-col grow p-4 md:p-5">
        <StyledArticleTitle
          title={title}
          className={cn("font-bold text-lg leading-snug line-clamp-2 mb-2 transition-colors", finalHoverColorClass)}
        />
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 grow">{summary}</p>

        <div className="flex items-center justify-between pt-4 border-t border-border/30 mt-auto">
          <div className="flex items-center text-xs text-muted-foreground">
            <ClientOnlyTime date={published_at} />
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            {onCommentIconClick && (
              <button
                onClick={handleCommentClick}
                className="flex items-center gap-1 text-xs hover:text-foreground transition-colors"
              >
                <MessageSquare size={14} />
                <span>{article.comment_count ?? 0}</span>
              </button>
            )}
            {onSaveToggle && article.isSaved !== undefined && (
              <ArticleSaveButton isSaved={isSaved} onClick={handleSaveClick} />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
