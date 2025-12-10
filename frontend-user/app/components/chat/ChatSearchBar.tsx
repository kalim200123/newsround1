"use client";

import { ChevronDown, ChevronUp, Search, X } from "lucide-react";

interface ChatSearchBarProps {
  isVisible: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onNavigate: (direction: "next" | "prev") => void;
  resultCount: number;
  currentIndex: number;
}

export default function ChatSearchBar({
  isVisible,
  onClose,
  searchQuery,
  onSearchQueryChange,
  onNavigate,
  resultCount,
  currentIndex,
}: ChatSearchBarProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="absolute top-0 left-0 right-0 bg-card/80 backdrop-blur-sm z-20 h-16 flex items-center px-3 border-b border-border animate-fade-in-down">
      <div className="flex items-center flex-1">
        <Search className="w-5 h-5 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="채팅 검색..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onNavigate("next");
            }
          }}
          autoFocus
          className="flex-1 bg-transparent px-3 text-foreground placeholder-muted-foreground focus:outline-none"
        />
      </div>
      {searchQuery && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground w-20 text-center">
            {resultCount > 0 ? `${currentIndex + 1} / ${resultCount}` : "0 / 0"}
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              onNavigate("prev");
            }}
            disabled={resultCount === 0}
            className="p-2 text-muted-foreground hover:text-foreground disabled:text-muted-foreground/50 disabled:cursor-not-allowed"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onNavigate("next");
            }}
            disabled={resultCount === 0}
            className="p-2 text-muted-foreground hover:text-foreground disabled:text-muted-foreground/50 disabled:cursor-not-allowed"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      )}
      <button
        onClick={onClose}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors ml-2"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}