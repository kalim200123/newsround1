"use client";

import { Bookmark } from "lucide-react";

interface ArticleSaveButtonProps {
  isSaved: boolean;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

export default function ArticleSaveButton({ isSaved, onClick, disabled = false }: ArticleSaveButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1 text-sm transition-colors ${
        isSaved ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-foreground"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      title={isSaved ? "저장 취소" : "저장하기"}
    >
      <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
    </button>
  );
}
