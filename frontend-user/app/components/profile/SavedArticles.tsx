"use client";

import { EmptyState } from "@/app/components/common/EmptyState";
import LoadingSpinner from "@/app/components/common/LoadingSpinner";
import { useSavedArticlesManager } from "@/hooks/useSavedArticles";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, FolderOpen, Layers, Plus, ServerCrash, Settings2 } from "lucide-react";
import { useState } from "react";
import ManageCategoriesModal from "./ManageCategoriesModal";
import SavedArticleCard from "./SavedArticleCard";

export default function SavedArticles() {
  const {
    categories,
    filteredArticles,
    totalCount,
    unclassifiedCount,
    isLoading,
    error,
    selectedCategoryId,
    setSelectedCategoryId,
    handleCreateCategory,
    handleDeleteCategory,
    handleRenameCategory,
    handleUpdateArticleCategory,
    handleUnsaveArticle,
    fetchData,
  } = useSavedArticlesManager();

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-32 w-full">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-muted-foreground animate-pulse">보관함을 불러오는 중...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 w-full">
          <EmptyState Icon={ServerCrash} title="오류 발생" description={error} />
          <button
            onClick={() => fetchData()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            다시 시도
          </button>
        </div>
      );
    }

    if (totalCount === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 w-full">
          <EmptyState
            Icon={Bookmark}
            title="저장된 기사가 없습니다"
            description="관심 있는 기사를 저장하여 나만의 지식 보관함을 만들어보세요."
          />
        </div>
      );
    }

    if (filteredArticles.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 w-full">
          <EmptyState
            Icon={FolderOpen}
            title="이 카테고리는 비어있습니다"
            description="다른 카테고리를 선택하거나 기사를 이 카테고리로 이동시켜보세요."
          />
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20"
      >
        <AnimatePresence mode="popLayout">
          {filteredArticles.map((article, index) => (
            <motion.div
              key={article?.id ? `${article.id}-${index}` : `article-placeholder-${index}`}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <SavedArticleCard
                article={article}
                categories={categories}
                onMove={handleUpdateArticleCategory}
                onUnsave={handleUnsaveArticle}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">내 보관함</h1>
          <p className="text-muted-foreground mt-1">
            총 <span className="font-semibold text-primary">{totalCount}</span>개의 기사가 저장되어 있습니다.
          </p>
        </div>
        <button
          onClick={() => setIsManageModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-secondary/50 hover:bg-secondary text-secondary-foreground rounded-full transition-all duration-200 text-sm font-medium backdrop-blur-sm border border-border/50"
        >
          <Settings2 size={16} />
          <span>카테고리 관리</span>
        </button>
      </div>

      {/* Category Filter (Horizontal Scroll) */}
      <div className="relative mb-10 group">
        <div className="flex overflow-x-auto pb-4 gap-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 mask-linear-fade">
          <CategoryChip
            label="전체"
            count={totalCount}
            isActive={selectedCategoryId === "all"}
            onClick={() => setSelectedCategoryId("all")}
            icon={Layers}
          />
          <CategoryChip
            label="미분류"
            count={unclassifiedCount}
            isActive={selectedCategoryId === null}
            onClick={() => setSelectedCategoryId(null)}
            icon={FolderOpen}
          />
          <div className="w-px h-8 bg-border mx-1 self-center shrink-0" />
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              label={category.name}
              count={category.article_count ?? 0}
              isActive={selectedCategoryId === category.id}
              onClick={() => setSelectedCategoryId(category.id)}
            />
          ))}
          <button
            onClick={() => setIsManageModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-sm font-medium shrink-0 whitespace-nowrap"
          >
            <Plus size={14} />
            <span>새 카테고리</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="min-h-[50vh]">{renderContent()}</main>

      {isManageModalOpen && (
        <ManageCategoriesModal
          categories={categories}
          onClose={() => setIsManageModalOpen(false)}
          onCreate={async (name) => {
            await handleCreateCategory(name);
            await fetchData();
          }}
          onRename={async (id, name) => {
            await handleRenameCategory(id, name);
            await fetchData();
          }}
          onDelete={async (id) => {
            await handleDeleteCategory(id);
            await fetchData();
          }}
        />
      )}
    </div>
  );
}

function CategoryChip({
  label,
  count,
  isActive,
  onClick,
  icon: Icon,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  icon?: React.ElementType;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 shrink-0 whitespace-nowrap border",
        isActive
          ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-105"
          : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:bg-accent hover:text-foreground"
      )}
    >
      {Icon && <Icon size={14} className={cn(isActive ? "text-primary-foreground" : "text-muted-foreground")} />}
      <span>{label}</span>
      {count > 0 && (
        <span
          className={cn(
            "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
            isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
