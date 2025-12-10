'use client';

import { useState } from 'react';
import { SavedArticle } from '@/lib/types/article';
import { SavedArticleCategory } from '@/lib/types/shared';
import { X, PlusCircle, MinusCircle, Trash2 } from 'lucide-react';
import ConfirmationPopover from '@/app/components/common/ConfirmationPopover';

interface EditCategoryModalProps {
  category: SavedArticleCategory;
  articlesInCategory: SavedArticle[];
  uncategorizedArticles: SavedArticle[];
  onClose: () => void;
  onSave: (categoryId: number, newName: string, articlesToAdd: number[], articlesToRemove: number[]) => Promise<void>;
  onDelete: () => void;
}

import Image from 'next/image';

const ArticleItem = ({ article, onToggle, isSelected, action }: { article: SavedArticle; onToggle: (id: number) => void; isSelected: boolean; action: 'add' | 'remove' }) => (
  <div 
    className={`flex items-center gap-4 p-2 rounded-lg transition-colors ${isSelected ? (action === 'add' ? 'bg-green-500/20' : 'bg-red-500/20') : 'hover:bg-muted/50'}`}
  >
    <Image 
      src={article.thumbnail_url || '/placeholder.png'}
      alt={article.title}
      width={64}
      height={36}
      className="rounded object-cover w-16 h-9"
    />
    <span className="text-white line-clamp-1 flex-1 mr-4">{article.title}</span>
    <button onClick={() => onToggle(article.saved_article_id!)} className="p-1">
      {action === 'add' ? (
        <PlusCircle size={20} className={`transition-transform ${isSelected ? 'text-green-400 rotate-45' : 'text-muted-foreground hover:text-foreground'}`} />
      ) : (
        <MinusCircle size={20} className={`transition-transform ${isSelected ? 'text-red-400 rotate-45' : 'text-muted-foreground hover:text-foreground'}`} />
      )}
    </button>
  </div>
);

export default function EditCategoryModal({ category, articlesInCategory, uncategorizedArticles, onClose, onSave, onDelete }: EditCategoryModalProps) {
  const [categoryName, setCategoryName] = useState(category.name);
  const [articlesToAdd, setArticlesToAdd] = useState<number[]>([]);
  const [articlesToRemove, setArticlesToRemove] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const toggleArticleToAdd = (id: number) => {
    setArticlesToAdd(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleArticleToRemove = (id: number) => {
    setArticlesToRemove(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(category.id, categoryName, articlesToAdd, articlesToRemove);
    setIsSaving(false);
    onClose();
  };

  const handleDeleteConfirm = () => {
    onDelete();
    setIsDeleteConfirmOpen(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4" onClick={onClose}>
        <div className="bg-card rounded-xl shadow-2xl w-full max-w-md md:max-w-2xl lg:max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <header className="p-4 md:p-6 flex justify-between items-center border-b border-zinc-700">
            <h2 className="text-xl md:text-2xl font-bold text-white">카테고리 수정</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors"><X className="text-muted-foreground" /></button>
          </header>

          <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 overflow-y-auto">
            {/* Left Side: Rename & Articles to Add */}
            <div className="flex flex-col gap-4 md:gap-6">
              <div>
                <label htmlFor="category-name" className="block text-sm font-medium text-foreground mb-2">카테고리 이름</label>
                <input
                  id="category-name"
                  type="text"
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  className="w-full p-3 rounded-md bg-input text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-white mb-3">기사 추가하기 (미분류)</h3>
                <div className="bg-card/50 rounded-lg p-2 md:p-3 border border-border h-48 md:h-64 overflow-y-auto space-y-2">
                  {uncategorizedArticles.length > 0 ? (
                    uncategorizedArticles.map(article => (
                      <ArticleItem key={article.saved_article_id} article={article} onToggle={toggleArticleToAdd} isSelected={articlesToAdd.includes(article.saved_article_id!)} action="add" />
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground pt-10">추가할 미분류 기사가 없습니다.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side: Articles to Remove */}
            <div>
              <h3 className="text-base md:text-lg font-semibold text-white mb-3">현재 포함된 기사 ({articlesInCategory.length})</h3>
              <div className="bg-card/50 rounded-lg p-2 md:p-3 border border-border h-48 md:h-82 overflow-y-auto space-y-2">
                {articlesInCategory.length > 0 ? (
                  articlesInCategory.map(article => (
                    <ArticleItem key={article.saved_article_id} article={article} onToggle={toggleArticleToRemove} isSelected={articlesToRemove.includes(article.saved_article_id!)} action="remove" />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground pt-10">카테고리에 기사가 없습니다.</p>
                )}
              </div>
            </div>
          </div>

          <footer className="p-4 md:p-6 flex justify-between items-center gap-4 border-t border-zinc-700">
            <button 
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-400 bg-red-500/10 rounded-md hover:bg-red-500/20 transition-colors"
            >
              <Trash2 size={16} />
              카테고리 삭제
            </button>
            <div className="flex gap-4">
              <button onClick={onClose} className="px-4 py-2 md:px-6 md:py-3 bg-muted text-foreground rounded-md font-semibold hover:bg-zinc-600 transition-colors">취소</button>
              <button onClick={handleSave} disabled={isSaving || !categoryName.trim()} className="px-4 py-2 md:px-6 md:py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:bg-muted disabled:cursor-not-allowed">
                {isSaving ? '저장 중...' : '변경사항 저장'}
              </button>
            </div>
          </footer>
        </div>
      </div>
      {isDeleteConfirmOpen && (
        <ConfirmationPopover
          title={`'${category.name}' 삭제`}
          message="이 카테고리를 정말로 삭제하시겠습니까? 카테고리 안의 기사들은 '미분류' 상태로 변경됩니다."
          confirmText="삭제"
          cancelText="취소"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setIsDeleteConfirmOpen(false)}
        />
      )}
    </>
  );
}
