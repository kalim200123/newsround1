"use client";

import { cn } from "@/lib/utils";

interface CategoryFiltersProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const categories = ["전체", "사회", "핫이슈", "정책", "fun", "법", "문화", "정치", "경제", "기술", "젠더"];

export default function CategoryFilters({ selectedCategory, onSelectCategory }: CategoryFiltersProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-4 scroller">
        <div className="flex items-center gap-2 flex-shrink-0">
            {categories.map((category) => (
                <button
                    key={category}
                    onClick={() => onSelectCategory(category)}
                    className={cn(
                        "px-4 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap",
                        selectedCategory === category
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                >
                    #{category}
                </button>
            ))}
        </div>
    </div>
  );
}
