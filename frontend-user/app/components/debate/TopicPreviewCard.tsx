"use client";

import { cn } from "@/lib/utils";
import { ArrowRight, Clock, TrendingUp } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

import { TopicPreview } from "@/lib/types/topic";

// Remove local interface definition

interface TopicPreviewCardProps {
  topic?: TopicPreview | null;
  isNotFound?: boolean;
  failedTopicId?: string;
}

export default function TopicPreviewCard({ topic, isNotFound, failedTopicId }: TopicPreviewCardProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  if (isNotFound || !topic) {
    return (
      <div className="block mt-2 max-w-full">
        <div
          className={cn(
            "w-full rounded-2xl border p-8 flex flex-col items-center justify-center text-center opacity-70 min-h-[300px]",
            isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-gray-100 border-gray-200"
          )}
        >
          <h4 className="font-bold text-xl text-foreground mb-2">토론을 찾을 수 없습니다</h4>
          <p className="text-sm text-muted-foreground">
            요청하신 토론 ID ({failedTopicId || "알 수 없음"}) 에 해당하는 토론이 존재하지 않습니다.
          </p>
        </div>
      </div>
    );
  }

  const proVotes = topic.left_count;
  const conVotes = topic.right_count;
  const totalVotes = proVotes + conVotes;
  const proPercentage = totalVotes > 0 ? (proVotes / totalVotes) * 100 : 50;
  const conPercentage = totalVotes > 0 ? (conVotes / totalVotes) * 100 : 50;

  // Deterministic gradient based on ID
  const gradients = [
    { bg: "from-blue-600 via-blue-500 to-cyan-400", accent: "bg-blue-500" },
    { bg: "from-purple-600 via-purple-500 to-pink-500", accent: "bg-purple-500" },
    { bg: "from-orange-500 via-red-500 to-pink-600", accent: "bg-red-500" },
    { bg: "from-emerald-500 via-teal-500 to-cyan-500", accent: "bg-teal-500" },
    { bg: "from-indigo-600 via-blue-600 to-purple-600", accent: "bg-indigo-500" },
  ];
  const gradient = gradients[topic.id % gradients.length];

  return (
    <Link
      href={`/debate/${topic.id}`}
      className={cn(
        "group block relative w-full rounded-2xl overflow-hidden transition-all duration-500",
        "hover:scale-[1.03] hover:shadow-2xl hover:shadow-black/20",
        "border border-border/50 hover:border-border",
        "min-h-[340px]"
      )}
      draggable="true"
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", `${window.location.origin}/debate/${topic.id}`);
        e.dataTransfer.setData("application/json", JSON.stringify({ type: "topic", data: topic }));
      }}
    >
      {/* Animated Background Gradient */}
      <div
        className={cn(
          "absolute inset-0 bg-linear-to-br transition-all duration-700",
          gradient.bg,
          "opacity-95 group-hover:opacity-100 group-hover:scale-105"
        )}
      />

      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]" />

      {/* Content Container */}
      <div className="relative h-full flex flex-col p-5 text-white z-10">
        {/* Top Section: Status Badge */}
        <div className="flex justify-between items-start mb-3">
          <div className="bg-green-500/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold border border-white/30 shadow-lg flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            진행중
          </div>
        </div>

        {/* Main Title */}
        <div className="flex-1 flex flex-col justify-center mb-4">
          <h3 className="text-xl md:text-2xl font-black leading-tight drop-shadow-lg line-clamp-3 mb-2">
            {topic.display_name}
          </h3>
          <p className="text-white/90 text-sm font-medium line-clamp-2 drop-shadow-md">
            {topic.summary || "당신의 의견을 들려주세요"}
          </p>
        </div>

        {/* Vote Statistics */}
        {totalVotes > 0 && (
          <div className="mb-4 space-y-2">
            {/* Vote Progress Bar */}
            <div className="relative h-2.5 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm border border-white/20">
              <div
                className="absolute left-0 top-0 h-full bg-linear-to-r from-blue-400 to-blue-500 transition-all duration-500"
                style={{ width: `${proPercentage}%` }}
              />
              <div
                className="absolute right-0 top-0 h-full bg-linear-to-l from-red-400 to-red-500 transition-all duration-500"
                style={{ width: `${conPercentage}%` }}
              />
            </div>

            {/* Vote Counts */}
            <div className="flex justify-between items-center text-xs font-bold">
              <div className="flex items-center gap-1.5 bg-blue-500/20 backdrop-blur-sm px-2 py-0.5 rounded-md border border-blue-400/30">
                <TrendingUp size={10} className="text-blue-300" />
                <span>{proVotes.toLocaleString()}표</span>
                <span className="text-blue-200">({proPercentage.toFixed(0)}%)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-red-500/20 backdrop-blur-sm px-2 py-0.5 rounded-md border border-red-400/30">
                <span className="text-red-200">({conPercentage.toFixed(0)}%)</span>
                <span>{conVotes.toLocaleString()}표</span>
                <TrendingUp size={10} className="text-red-300 rotate-180" />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Section: Time & CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-white/20">
          {topic.vote_end_at && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-white/90 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
              <Clock size={10} />
              <span>{topic.vote_end_at} 마감</span>
            </div>
          )}

          <div className="bg-white text-black px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-xl group-hover:bg-gray-100 group-hover:scale-105 transition-all duration-300 ml-auto">
            투표하기
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Decorative Gradient Overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

      {/* Shine Effect on Hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-linear-to-tr from-transparent via-white/10 to-transparent" />
    </Link>
  );
}
