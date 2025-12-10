"use client";

import { useAuth } from "@/app/context/AuthContext";
import { Comment } from "@/lib/types/comment";
import { format, formatDistanceToNow, isBefore, subHours, addHours } from "date-fns";
import { ko } from "date-fns/locale";
import { getFullImageUrl } from "@/lib/utils";
import { Check, Edit, Flag, MoreVertical, ThumbsDown, ThumbsUp, Trash } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import CommentInput from "./CommentInput";

interface TopicCommentItemProps {
  comment: Comment;
  onPostReply: (content: string, parentId: number | null) => Promise<void>;
  onEdit: (commentId: number, content: string) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
  onReaction: (commentId: number, type: "LIKE" | "DISLIKE") => Promise<void>;
  onReport: (commentId: number) => Promise<void>;
  level?: number; // Tracking nesting level for visuals
  stanceLeft: string;
  stanceRight: string;
}

const StanceBadge = ({
  stance,
  leftLabel,
  rightLabel,
}: {
  stance: "LEFT" | "RIGHT" | "NEUTRAL" | undefined;
  leftLabel: string;
  rightLabel: string;
}) => {
  if (!stance || stance === "NEUTRAL") return null;

  const isPro = stance === "LEFT";
  const text = isPro ? leftLabel : rightLabel;

  return (
    <span className={`flex items-center gap-1 text-sm font-bold ${isPro ? "text-red-500" : "text-blue-500"}`}>
      <span
        className={`flex items-center justify-center w-4 h-4 rounded-sm ${
          isPro ? "bg-red-500" : "bg-blue-500"
        } text-white`}
      >
        {isPro ? <Check size={12} strokeWidth={4} /> : <Check size={12} strokeWidth={4} />}
      </span>
      {text}
    </span>
  );
};

export default function TopicCommentItem({
  comment,
  onPostReply,
  onEdit,
  onDelete,
  onReaction,
  onReport,
  level = 0,
  stanceLeft,
  stanceRight,
}: TopicCommentItemProps) {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAuthor = user?.id && comment.author_id ? Number(user.id) === Number(comment.author_id) : false;

  const commentDate = addHours(new Date(comment.created_at), 9);
  const now = addHours(new Date(), 9);
  const twentyFourHoursAgo = subHours(now, 24);
  const isOlderThan24Hours = isBefore(commentDate, twentyFourHoursAgo);

  const formattedTime = isOlderThan24Hours
    ? format(commentDate, "yyyy-MM-dd HH:mm", { locale: ko })
    : formatDistanceToNow(commentDate, { addSuffix: true, locale: ko });

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEditSubmit = async (content: string) => {
    await onEdit(comment.id, content);
    setIsEditing(false);
    setShowMenu(false);
  };

  const handleReplySubmit = async (content: string, parentId: number | null) => {
    await onPostReply(content, parentId);
    setIsReplying(false);
  };

  return (
    <div className={`relative ${level > 0 ? "mt-4" : ""}`}>
      {/* Connector Line for replies */}
      {level > 0 && <div className="absolute top-0 -left-4 w-4 h-px bg-border" />}

      <div className={`flex gap-4 group ${level > 0 ? "ml-4" : ""}`}>
        {/* Avatar */}
        <div className="shrink-0 pt-1">
          <Image
            src={getFullImageUrl(comment.profile_image_url)}
            alt={comment.author_name}
            width={40}
            height={40}
            className="rounded-full object-cover border border-border/50"
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-[15px] text-foreground/90">{comment.author_name}</span>
              <span className="text-xs text-muted-foreground/60">•</span>
              <span className="text-xs text-muted-foreground/80">{formattedTime}</span>
            </div>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-full text-muted-foreground/50 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical size={16} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-popover border border-border rounded-lg shadow-lg py-1 z-10 text-sm">
                  {isAuthor ? (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-muted/50 flex items-center gap-2"
                      >
                        <Edit size={14} /> 수정
                      </button>
                      <button
                        onClick={() => {
                          onDelete(comment.id);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-500 flex items-center gap-2"
                      >
                        <Trash size={14} /> 삭제
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        onReport(comment.id);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-500 flex items-center gap-2"
                    >
                      <Flag size={14} /> 신고
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stance Badge & Body */}
          <div className="mb-2">
            <StanceBadge stance={comment.stance} leftLabel={stanceLeft} rightLabel={stanceRight} />
          </div>

          {!isEditing ? (
            <>
              {comment.status === "DELETED_BY_USER" || comment.status === "DELETED_BY_ADMIN" ? (
                <p className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded-lg">[삭제된 댓글입니다]</p>
              ) : comment.status === "HIDDEN" ? (
                <p className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded-lg">[숨겨진 댓글입니다]</p>
              ) : (
                <div className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {comment.content}
                </div>
              )}
            </>
          ) : (
            <div className="mt-2">
              <CommentInput
                onSubmit={(content) => handleEditSubmit(content)}
                initialContent={comment.content}
                onCancel={() => setIsEditing(false)}
                parentId={comment.id}
                placeholder="댓글 수정..."
              />
            </div>
          )}

          {/* Actions Footer */}
          {!isEditing && (!comment.status || comment.status === "ACTIVE") && (
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => !isAuthor && onReaction(comment.id, "LIKE")}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  comment.my_reaction === "LIKE" ? "text-blue-600" : "text-muted-foreground hover:text-foreground"
                } ${isAuthor ? "cursor-default opacity-50" : ""}`}
              >
                <ThumbsUp size={14} className={comment.my_reaction === "LIKE" ? "fill-current" : ""} />
                <span>{comment.like_count || 0}</span>
              </button>

              <button
                onClick={() => !isAuthor && onReaction(comment.id, "DISLIKE")}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  comment.my_reaction === "DISLIKE" ? "text-red-500" : "text-muted-foreground hover:text-foreground"
                } ${isAuthor ? "cursor-default opacity-50" : ""}`}
              >
                <ThumbsDown size={14} className={comment.my_reaction === "DISLIKE" ? "fill-current" : ""} />
                <span>{comment.dislike_count || 0}</span>
              </button>

              <button
                onClick={() => setIsReplying(!isReplying)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ml-2"
              >
                댓글 달기
              </button>
            </div>
          )}

          {/* Reply Input */}
          {isReplying && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-1">
              <CommentInput
                onSubmit={handleReplySubmit}
                onCancel={() => setIsReplying(false)}
                parentId={comment.id}
                placeholder={`@${comment.author_name}님에게 답글 작성...`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Recursive Replies */}
      {comment.children && comment.children.length > 0 && (
        <div className="mt-2 border-l-2 border-border/40 ml-5 pl-0">
          {comment.children.map((child) => (
            <TopicCommentItem
              key={child.id}
              comment={child}
              onPostReply={onPostReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReaction={onReaction}
              onReport={onReport}
              level={level + 1}
              stanceLeft={stanceLeft}
              stanceRight={stanceRight}
            />
          ))}
        </div>
      )}
    </div>
  );
}
