"use client";

import { useEffect } from 'react';
import { X } from 'lucide-react';
import CommentSection from './CommentSection';
import { Article } from '@/lib/types/article';
import { Comment } from '@/lib/types/comment';

interface CommentSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  article: Article | null;
  side: 'left' | 'right';
  onCommentCountUpdate: (articleId: number, newCount: number) => void;
  comments: Comment[];
  isCommentsLoading: boolean;
  refetchComments: (article: Article) => void;
}

export default function CommentSidePanel({ 
  isOpen, 
  onClose, 
  article, 
  side, 
  onCommentCountUpdate,
  comments,
  isCommentsLoading,
  refetchComments,
}: CommentSidePanelProps) {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const panelClasses = `
    fixed top-0 bottom-0 bg-card z-50 flex flex-col w-full lg:w-1/4
    transition-transform duration-300 ease-in-out
    ${side === 'left' ? 'left-0' : 'right-0'}
    ${isOpen ? 'translate-x-0' : (side === 'left' ? '-translate-x-full' : 'translate-x-full')}
  `;

  if (!isOpen && !article) return null; // Keep component mounted during transition

  return (
    <div className={panelClasses}>
      {article && (
        <>
          <div className="flex justify-between items-center p-4 border-b border-zinc-700 shrink-0">
            <div className="flex flex-col overflow-hidden">
              <h2 className="text-lg font-bold text-white">댓글</h2>
              <p className="text-sm text-muted-foreground truncate">{article.title}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0 ml-4">
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <CommentSection
              articleId={article.id}
              article={article}
              onCommentCountUpdate={onCommentCountUpdate}
              comments={comments}
              isLoading={isCommentsLoading}
              refetchComments={refetchComments}
            />
          </div>
        </>
      )}
    </div>
  );
}