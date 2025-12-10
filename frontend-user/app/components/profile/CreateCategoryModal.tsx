'use client';

import { useState } from 'react';
import { SavedArticle } from "@/lib/types/article";
import Image from 'next/image';
import { X } from 'lucide-react';

interface CreateCategoryModalProps {
  uncategorizedArticles: SavedArticle[];
  onClose: () => void;
  onCreate: (categoryName: string, articleIds: number[]) => Promise<void>;
}

export default function CreateCategoryModal({ uncategorizedArticles, onClose, onCreate }: CreateCategoryModalProps) {
  const [categoryName, setCategoryName] = useState('');
  const [selectedArticleIds, setSelectedArticleIds] = useState<number[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleToggleArticle = (articleId: number) => {
    setSelectedArticleIds(prev =>
      prev.includes(articleId) ? prev.filter(id => id !== articleId) : [...prev, articleId]
    );
  };

  const handleCreate = async () => {
    if (!categoryName.trim()) {
      alert('카테고리 이름을 입력해주세요.');
      return;
    }
    setIsCreating(true);
    await onCreate(categoryName, selectedArticleIds);
    setIsCreating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-md lg:max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 md:p-6 flex justify-between items-center border-b border-zinc-700">
          <h2 className="text-xl md:text-2xl font-bold text-white">새 카테고리 만들기</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X className="text-muted-foreground" />
          </button>
        </header>

        <div className="p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto">
          <div>
            <label htmlFor="category-name" className="block text-sm font-medium text-foreground mb-2">카테고리 이름</label>
            <input
              id="category-name"
              type="text"
              value={categoryName}
              onChange={e => setCategoryName(e.target.value)}
              placeholder="예: 기술, 경제, 디자인"
              className="w-full p-3 rounded-md bg-input text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <h3 className="text-base md:text-lg font-semibold text-white mb-3">이 카테고리에 추가할 기사 선택 (선택 사항)</h3>
            <div className="bg-card/50 rounded-lg p-2 md:p-4 border border-border max-h-60 md:max-h-80 overflow-y-auto space-y-3">
              {uncategorizedArticles.length > 0 ? (
                uncategorizedArticles.map(article => (
                  <div
                    key={article.saved_article_id}
                    onClick={() => handleToggleArticle(article.saved_article_id!)}
                    className={`flex items-center gap-4 p-2 md:p-3 rounded-lg cursor-pointer transition-all ${selectedArticleIds.includes(article.saved_article_id!) ? 'bg-red-500/20 ring-2 ring-red-500' : 'hover:bg-muted/50'}`}>
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        readOnly
                        checked={selectedArticleIds.includes(article.saved_article_id!)}
                        className="h-5 w-5 rounded-sm text-red-500 bg-input border-border focus:ring-red-500 focus:ring-offset-0 focus:ring-2"
                      />
                    </div>
                    <Image src={article.thumbnail_url || '/placeholder.png'} alt={article.title} width={80} height={45} className="rounded-md object-cover w-20 h-auto aspect-video" />
                    <span className="text-sm md:text-base text-white font-medium line-clamp-2 flex-1">{article.title}</span>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">미분류된 기사가 없습니다.</p>
              )}
            </div>
          </div>
        </div>

        <footer className="p-4 md:p-6 flex flex-col sm:flex-row justify-end gap-4 border-t border-zinc-700">
          <button onClick={onClose} className="px-4 py-2 md:px-6 md:py-3 bg-muted text-foreground rounded-md font-semibold hover:bg-zinc-600 transition-colors">취소</button>
          <button onClick={handleCreate} disabled={isCreating || !categoryName.trim()} className="px-4 py-2 md:px-6 md:py-3 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors disabled:bg-muted disabled:cursor-not-allowed">
            {isCreating ? '생성 중...' : `카테고리 생성 및 ${selectedArticleIds.length}개 기사 추가`}
          </button>
        </footer>
      </div>
    </div>
  );
}