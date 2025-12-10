'use client';

import { useState } from 'react';
import { SavedArticleCategory } from "@/lib/types/shared";
import { X, Trash2, Edit, Check, Loader, Plus } from 'lucide-react';

interface ManageCategoriesModalProps {
  categories: SavedArticleCategory[];
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  onRename: (categoryId: number, newName: string) => Promise<void>;
  onDelete: (categoryId: number) => Promise<void>;
}

export default function ManageCategoriesModal({ categories, onClose, onCreate, onRename, onDelete }: ManageCategoriesModalProps) {
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [createCategoryName, setCreateCategoryName] = useState('');
  const [loadingState, setLoadingState] = useState<{ type: 'create' | 'rename' | 'delete'; id: number | 'new' } | null>(null);

  const handleStartEdit = (category: SavedArticleCategory) => {
    setEditingCategoryId(category.id);
    setNewCategoryName(category.name);
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setNewCategoryName('');
  };

  const handleSaveRename = async (categoryId: number) => {
    if (!newCategoryName.trim()) return;
    setLoadingState({ type: 'rename', id: categoryId });
    await onRename(categoryId, newCategoryName);
    setLoadingState(null);
    handleCancelEdit();
  };

  const handleDeleteCategory = async (categoryId: number) => {
    setLoadingState({ type: 'delete', id: categoryId });
    await onDelete(categoryId);
    setLoadingState(null);
  };

  const handleCreateCategory = async () => {
    if (!createCategoryName.trim()) return;
    setLoadingState({ type: 'create', id: 'new' });
    await onCreate(createCategoryName);
    setLoadingState(null);
    setCreateCategoryName('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-5 flex justify-between items-center border-b border-zinc-700">
          <h2 className="text-xl font-bold text-white">카테고리 관리</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors"><X className="text-muted-foreground" /></button>
        </header>
        
        <div className="p-5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={createCategoryName}
              onChange={(e) => setCreateCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
              placeholder="새 카테고리 이름..."
              className="grow bg-input text-foreground px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleCreateCategory} className="p-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed" disabled={!createCategoryName.trim() || loadingState?.type === 'create'}>
              {loadingState?.type === 'create' ? <Loader size={18} className="animate-spin" /> : <Plus size={18} />}
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              {editingCategoryId === cat.id ? (
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(cat.id)}
                  className="grow bg-input text-foreground px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              ) : (
                <span className="text-white">{cat.name}</span>
              )}
              <div className="flex items-center gap-2 ml-4">
                {editingCategoryId === cat.id ? (
                  <>
                    <button onClick={() => handleSaveRename(cat.id)} className="p-2 text-green-400 hover:bg-green-500/20 rounded-full" disabled={loadingState?.id === cat.id}>
                      {loadingState?.type === 'rename' && loadingState.id === cat.id ? <Loader size={18} className="animate-spin" /> : <Check size={18} />}
                    </button>
                    <button onClick={() => handleCancelEdit()} className="p-2 text-muted-foreground hover:bg-muted rounded-full"><X size={18} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleStartEdit(cat)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full" disabled={!!loadingState}>
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full" disabled={loadingState?.id === cat.id}>
                      {loadingState?.type === 'delete' && loadingState.id === cat.id ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <footer className="p-5 border-t border-zinc-700">
            <p className="text-xs text-muted-foreground text-center">카테고리를 삭제하면 해당 카테고리의 기사들은 &apos;미분류&apos; 상태가 됩니다.</p>
        </footer>
      </div>
    </div>
  );
}
