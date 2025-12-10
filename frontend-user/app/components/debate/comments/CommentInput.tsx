"use client";

import { Button } from "@/app/components/common/Button";
import { useAuth } from "@/app/context/AuthContext";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface CommentInputProps {
  onSubmit: (content: string, parentId: number | null) => Promise<void>;
  initialContent?: string;
  onCancel?: () => void;
  parentId?: number | null;
  placeholder?: string;
}

export default function CommentInput({
  onSubmit,
  initialContent = "",
  onCancel,
  parentId = null,
  placeholder = "당신의 의견을 남겨주세요...",
}: CommentInputProps) {
  const { user } = useAuth();
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content, parentId);
      setContent(""); // Clear input after successful submission
      if (onCancel) onCancel(); // Close edit/reply form
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="border border-border rounded-lg p-4 text-center text-muted-foreground">
        댓글을 작성하려면{" "}
        <a href="/login" className="text-primary hover:underline">
          로그인
        </a>
        해주세요.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-4 items-start">
      <div className="shrink-0 pt-1">
        <Image
          src={user.profile_image_url || "/user-placeholder.svg"}
          alt={user.nickname || "user"}
          width={42}
          height={42}
          className="rounded-full border border-border/50 shadow-sm"
        />
      </div>
      <div className="grow group relative">
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-transparent opacity-0 group-focus-within:opacity-100 rounded-xl transition-opacity pointer-events-none" />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 bg-background dark:bg-zinc-900 border border-border/80 rounded-xl text-[15px] text-foreground placeholder-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200 resize-none shadow-sm min-h-[100px]"
          disabled={isSubmitting}
        />
        <div className="flex justify-end gap-2 mt-2">
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
              className="text-muted-foreground hover:text-foreground"
            >
              취소
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isSubmitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md px-6 rounded-lg font-medium transition-all transform active:scale-95"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "등록 중..." : initialContent ? "수정완료" : "의견 남기기"}
          </Button>
        </div>
      </div>
    </form>
  );
}
