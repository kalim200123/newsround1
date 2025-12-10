"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { getCategoryTheme } from "@/lib/categoryColors";

interface CategorySourceSidebarProps {
  sources: string[];
  selectedSource: string;
  setSelectedSource: (source: string) => void;
  setCurrentPage: (page: number) => void;
  categoryTheme: ReturnType<typeof getCategoryTheme>;
}

export default function CategorySourceSidebar({
  sources,
  selectedSource,
  setSelectedSource,
  setCurrentPage,
  categoryTheme,
}: CategorySourceSidebarProps) {
  return (
    <div className="w-56 shrink-0 pr-6 border-r border-border/50 hidden lg:block"> {/* Hidden on small screens */}
      <h3 className="text-lg font-bold text-foreground mb-4">언론사 필터</h3>
      <nav className="flex flex-col space-y-2">
        {sources.map((source) => (
          <button
            key={source}
            onClick={() => {
              setSelectedSource(source);
              setCurrentPage(1);
            }}
            className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors
              ${selectedSource === source
                ? `${categoryTheme.bg} text-white`
                : "text-muted-foreground hover:bg-secondary/70"
              }`}
          >
            <span>{source === "전체" ? "전체 언론사" : source}</span>
            {selectedSource === source && <ChevronRight size={16} />}
          </button>
        ))}
      </nav>
    </div>
  );
}
