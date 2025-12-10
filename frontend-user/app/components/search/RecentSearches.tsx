"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

const MAX_RECENT_SEARCHES = 7;
const LOCAL_STORAGE_KEY = "recentSearches";

interface RecentSearchesProps {
  onSearch: (query: string) => void;
}

export const getRecentSearches = (): string[] => {
  const storedSearches = localStorage.getItem(LOCAL_STORAGE_KEY);
  return storedSearches ? JSON.parse(storedSearches) : [];
};

export const addRecentSearch = (query: string) => {
  if (typeof window === "undefined") return; // Keep this check for addRecentSearch
  const searches = getRecentSearches();
  const updatedSearches = [query, ...searches.filter((s) => s.toLowerCase() !== query.toLowerCase())].slice(
    0,
    MAX_RECENT_SEARCHES
  );
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedSearches));
};

export default function RecentSearches({ onSearch }: RecentSearchesProps) {
  const [searches, setSearches] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      return getRecentSearches();
    }
    return []; // Default value for SSR
  });

  const { resolvedTheme } = useTheme();


  const handleRemove = (e: React.MouseEvent, searchToRemove: string) => {
    e.stopPropagation(); // Prevent triggering onSearch when clicking the 'x'
    const updatedSearches = searches.filter((s) => s !== searchToRemove);
    setSearches(updatedSearches);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedSearches));
  };

  const handleClearAll = () => {
    setSearches([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  if (searches.length === 0) {
    return null; // Don't render anything if there are no recent searches
  }

  // Force colors based on theme
  const isDark = resolvedTheme === "dark";
  const bgColor = isDark ? "#18181b" : "#f4f4f5"; // zinc-900 : zinc-100
  const textColor = isDark ? "#e4e4e7" : "#52525b"; // zinc-200 : zinc-600
  const borderColor = isDark ? "#27272a" : "#e4e4e7"; // zinc-800 : zinc-200


  return (
    <div className="w-full max-w-2xl mx-auto mt-6">
      <div className="flex justify-between items-center mb-3 px-2">
        <h2 className="text-sm font-semibold text-muted-foreground flex items-center">
          <Clock size={14} className="mr-2" />
          최근 검색어
        </h2>
        <button
          onClick={handleClearAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          전체 삭제
        </button>
      </div>
      <motion.div layout className="flex flex-wrap gap-2">
        <AnimatePresence>
          {searches.map((search) => (
            <motion.div
              key={search}
              layout
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              onClick={() => onSearch(search)}
              style={{
                backgroundColor: bgColor,
                color: textColor,
                borderColor: borderColor,
              }}
              className="flex items-center border rounded-full px-4 py-2 text-sm cursor-pointer transition-colors hover:opacity-80"
            >
              <span>{search}</span>
              <button
                onClick={(e) => handleRemove(e, search)}
                className="ml-2 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
