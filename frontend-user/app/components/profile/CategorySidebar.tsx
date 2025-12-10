import { SavedArticleCategory } from "@/lib/types/shared";
import { PlusCircle, Tag, Folder, Menu } from 'lucide-react';

interface CategoryItemProps {
  name: string;
  count: number;
  isSelected: boolean;
  onClick: () => void;
  Icon: React.ElementType;
}

const CategoryItem = ({ name, count, isSelected, onClick, Icon }: CategoryItemProps) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
        isSelected
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="flex-1 text-left truncate">{name}</span>
      <span className={`px-2 py-0.5 text-xs rounded-full ${isSelected ? 'bg-primary-foreground text-primary' : 'bg-muted text-muted-foreground'}`}>{count}</span>
    </button>
  );
};

interface CategorySidebarProps {
  categories: SavedArticleCategory[];
  selectedCategoryId: number | null | 'all';
  onSelectCategory: (id: number | null | 'all') => void;
  totalCount: number;
  unclassifiedCount: number;
  onManageCategories: () => void;
}

export default function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  totalCount,
  unclassifiedCount,
  onManageCategories,
}: CategorySidebarProps) {
  return (
    <aside className="w-full md:w-64 shrink-0 space-y-4">
      <h2 className="text-lg font-bold text-foreground px-3">분류</h2>
      <div className="space-y-1">
        <CategoryItem
          name="모든 기사"
          count={totalCount}
          isSelected={selectedCategoryId === 'all'}
          onClick={() => onSelectCategory('all')}
          Icon={Menu}
        />
        <CategoryItem
          name="미분류"
          count={unclassifiedCount}
          isSelected={selectedCategoryId === null}
          onClick={() => onSelectCategory(null)}
          Icon={Folder}
        />
        {categories.map((category) => (
          <CategoryItem
            key={category.id}
            name={category.name}
            count={category.article_count ?? 0}
            isSelected={selectedCategoryId === category.id}
            onClick={() => onSelectCategory(category.id)}
            Icon={Tag}
          />
        ))}
      </div>
      <div className="pt-2">
        <button
          onClick={onManageCategories}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          <span>카테고리 관리</span>
        </button>
      </div>
    </aside>
  );
}
