"use client";

import { useEffect, useState } from "react";

import { TopicPreview } from "@/lib/types/topic";
import { cn } from "@/lib/utils";
import { ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";

interface TopicEmbedCardProps {
  topic: TopicPreview;
  className?: string;
}

export default function TopicEmbedCard({ topic, className }: TopicEmbedCardProps) {
  const calculateTimeLeft = (endString?: string) => {
    if (!endString) return { text: "", isUrgent: false };
    const end = new Date(endString);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      return { text: "마감됨", isUrgent: false };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    // If 1 day or more (meaning more than 24 hours), show D-Day
    if (days >= 1) {
      return { text: `D-${days}`, isUrgent: false };
    }

    // Less than 24 hours
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      text: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`,
      isUrgent: true,
    };
  };

  const [timeState, setTimeState] = useState(() => calculateTimeLeft(topic.vote_end_at));

  useEffect(() => {
    if (!topic.vote_end_at) return;

    // Update every second
    const timer = setInterval(() => {
      setTimeState(calculateTimeLeft(topic.vote_end_at));
    }, 1000);

    return () => clearInterval(timer);
  }, [topic.vote_end_at]);

  const proVotes = topic.left_count;
  const conVotes = topic.right_count;
  const totalVotes = proVotes + conVotes;
  const proPercentage = totalVotes > 0 ? (proVotes / totalVotes) * 100 : 50;
  const conPercentage = totalVotes > 0 ? (conVotes / totalVotes) * 100 : 50;

  // Deterministic gradient based on ID (same as TopicPreviewCard)
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
        "group block relative w-full h-[300px] rounded-xl overflow-hidden transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-lg",
        "border border-white/20",
        className
      )}
    >
      {/* Animated Background Gradient */}
      <div
        className={cn(
          "absolute inset-0 bg-linear-to-br transition-all duration-700",
          gradient.bg,
          "opacity-100 group-hover:bg-linear-to-bl"
        )}
      />

      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]" />

      {/* Content Container */}
      <div className="relative h-full flex flex-col p-4 text-white z-10">
        {/* Top Badge */}
        <div className="flex justify-between items-start mb-2">
          <div className="bg-green-500/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/30 shadow-lg flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            진행중
          </div>

          {/* D-Day / Countdown Badge */}
          {timeState.text && (
            <div className="bg-red-500/90 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-black border border-white/30 shadow-md">
              {timeState.text} {timeState.isUrgent && "남음"}
            </div>
          )}
        </div>

        {/* Title & Summary */}
        <div className="flex-1 flex flex-col justify-center mb-3">
          <h3 className="text-xl font-black leading-tight drop-shadow-lg line-clamp-2 mb-1.5 break-keep">
            {topic.display_name}
          </h3>
          <p className="text-white/80 text-xs font-medium line-clamp-2 drop-shadow-md">
            {topic.summary || "당신의 의견을 들려주세요"}
          </p>
        </div>

        {/* Voting UI */}
        {totalVotes > 0 && (
          <div className="mb-3 space-y-1.5">
            {/* Progress Bar */}
            <div className="relative h-2 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm border border-white/20">
              <div
                className="absolute left-0 top-0 h-full bg-linear-to-r from-blue-400 to-blue-500 transition-all duration-500"
                style={{ width: `${proPercentage}%` }}
              />
              <div
                className="absolute right-0 top-0 h-full bg-linear-to-l from-red-400 to-red-500 transition-all duration-500"
                style={{ width: `${conPercentage}%` }}
              />
            </div>

            {/* Stats */}
            <div className="flex justify-between items-center text-[10px] font-bold">
              <div className="flex items-center gap-1 bg-blue-500/20 backdrop-blur-sm px-1.5 py-0.5 rounded border border-blue-400/30">
                <TrendingUp size={8} className="text-blue-300" />
                <span>
                  {proVotes.toLocaleString()}표 ({proPercentage.toFixed(0)}%)
                </span>
              </div>
              <div className="flex items-center gap-1 bg-red-500/20 backdrop-blur-sm px-1.5 py-0.5 rounded border border-red-400/30">
                <span>
                  ({conPercentage.toFixed(0)}%) {conVotes.toLocaleString()}표
                </span>
                <TrendingUp size={8} className="text-red-300 rotate-180" />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-white/20 mt-auto">
          <div className="bg-white text-black px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-lg group-hover:scale-105 transition-transform">
            투표하기
            <ArrowRight size={10} />
          </div>
        </div>
      </div>
    </Link>
  );
}
