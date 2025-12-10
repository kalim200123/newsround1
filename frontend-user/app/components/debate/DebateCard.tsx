"use client";

import { Topic } from "@/lib/types/topic";
import { cn } from "@/lib/utils";
import { ArrowRight, Clock, Eye, TrendingUp } from "lucide-react";
import Link from "next/link";

interface DebateCardProps {
  topic: Topic & { pro_votes?: number; con_votes?: number; category?: string };
  status: "ongoing" | "past";
  isFeatured?: boolean;
}

export default function DebateCard({ topic, status, isFeatured = false }: DebateCardProps) {
  const proVotes = topic.pro_votes || topic.vote_count_left || 0;
  const conVotes = topic.con_votes || topic.vote_count_right || 0;
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

  // Calculate remaining time
  const getRemainingTime = (dateString: string) => {
    const endDate = new Date(dateString);
    endDate.setDate(endDate.getDate() + 7);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays}일 남음` : "마감됨";
  };

  const remainingTime = getRemainingTime(topic.published_at);

  return (
    <Link
      href={`/debate/${topic.id}`}
      className={cn(
        "group block relative w-full rounded-2xl overflow-hidden transition-all duration-500",
        "hover:scale-[1.03] hover:shadow-2xl hover:shadow-black/20",
        "border border-border/50 hover:border-border",
        isFeatured ? "min-h-[500px]" : "min-h-[380px]"
      )}
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
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]\" />

      {/* Content Container */}
      <div className="relative h-full flex flex-col p-6 text-white z-10">
        {/* Top Section: Badges */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-2 flex-wrap">
            {/* Category Badge */}
            {topic.category && (
              <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold border border-white/30 shadow-lg">
                {topic.category}
              </div>
            )}
            {/* Status Badge */}
            {status === "ongoing" ? (
              <div className="bg-green-500/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold border border-white/30 shadow-lg flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                진행중
              </div>
            ) : (
              <div className="bg-gray-700/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold border border-white/30 shadow-lg">
                종료됨
              </div>
            )}
          </div>

          {/* View Count */}
          <div className="bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold border border-white/20">
            <Eye size={12} />
            <span>{topic.view_count.toLocaleString()}</span>
          </div>
        </div>

        {/* Main Title */}
        <div className="flex-1 flex flex-col justify-center mb-6">
          <h3
            className={cn(
              "font-black leading-tight drop-shadow-lg line-clamp-3 mb-3",
              isFeatured ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl"
            )}
          >
            {topic.display_name}
          </h3>
          <p className="text-white/90 text-sm md:text-base font-medium line-clamp-2 drop-shadow-md">
            {topic.summary || "당신의 의견을 들려주세요"}
          </p>
        </div>

        {/* Vote Statistics */}
        {totalVotes > 0 && (
          <div className="mb-4 space-y-2">
            {/* Vote Progress Bar */}
            <div className="relative h-3 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm border border-white/20">
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
              <div className="flex items-center gap-1.5 bg-blue-500/20 backdrop-blur-sm px-2 py-1 rounded-md border border-blue-400/30">
                <TrendingUp size={12} className="text-blue-300" />
                <span>{proVotes.toLocaleString()}표</span>
                <span className="text-blue-200">({proPercentage.toFixed(0)}%)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-red-500/20 backdrop-blur-sm px-2 py-1 rounded-md border border-red-400/30">
                <span className="text-red-200">({conPercentage.toFixed(0)}%)</span>
                <span>{conVotes.toLocaleString()}표</span>
                <TrendingUp size={12} className="text-red-300 rotate-180" />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Section: Time & CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-white/20">
          <div className="flex items-center gap-2 text-xs font-medium text-white/90 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
            <Clock size={12} />
            <span>{remainingTime}</span>
          </div>

          <div className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-black flex items-center gap-2 shadow-xl group-hover:bg-gray-100 group-hover:scale-105 transition-all duration-300">
            {status === "ongoing" ? "투표하기" : "결과보기"}
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
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
