"use client";

import { Topic } from "@/lib/types/topic"; // Assuming Topic has at least 'id' and 'display_name'
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { useTheme } from "next-themes";


interface TrendingSearchesProps {
  topics: Topic[];
  onSearch: (query: string) => void;
}

export default function TrendingSearches({ topics, onSearch }: TrendingSearchesProps) {
  const { resolvedTheme } = useTheme();

  if (!topics || topics.length === 0) {
    return null;
  }

  // Force colors based on theme
  const isDark = resolvedTheme === "dark";
  const bgColor = isDark ? "#18181b" : "#f4f4f5"; // zinc-900 : zinc-100
  const textColor = isDark ? "#e4e4e7" : "#52525b"; // zinc-200 : zinc-600
  const borderColor = isDark ? "#27272a" : "#e4e4e7"; // zinc-800 : zinc-200

  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      <h2 className="text-sm font-semibold text-muted-foreground flex items-center mb-3 px-2">
        <Flame size={14} className="mr-2 text-red-500" />
        인기 검색어
      </h2>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic, index) => (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => onSearch(topic.display_name)}
            style={{
              backgroundColor: bgColor,
              color: textColor,
              borderColor: borderColor,
            }}
            className="border rounded-full px-4 py-2 text-sm cursor-pointer transition-all hover:opacity-80"
          >
            <span className="font-semibold text-red-500 mr-1.5">#{index + 1}</span>
            {topic.display_name}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
