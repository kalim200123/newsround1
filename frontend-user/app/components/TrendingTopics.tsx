import { Topic } from "@/lib/types/topic";
import { cn, formatRelativeTime } from "@/lib/utils";
import { ArrowRight, Eye, MessageCircle, Trophy, Users } from "lucide-react";

interface TrendingTopicsProps {
  topics: Topic[];
  displayMode: "popular" | "latest";
  onTopicSelect: (topic: Topic) => void;
}

export default function TrendingTopics({ topics, displayMode, onTopicSelect }: TrendingTopicsProps) {
  return (
    <div className="h-full overflow-y-auto">
      {topics.length === 0 ? (
        <p className="text-muted-foreground text-center pt-10">표시할 토픽이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-0">
          {topics.map((topic, index) => {
            const rank = index + 1;
            const isPopular = displayMode === "popular";
            const isTopThree = isPopular && rank <= 3;

            const proVotes = topic.vote_count_left || 0;
            const conVotes = topic.vote_count_right || 0;
            const totalVotes = topic.total_votes || proVotes + conVotes;

            // Medal colors for top 3
            const medalColors = [
              {
                bg: "from-yellow-500 via-yellow-400 to-amber-400",
                icon: "text-yellow-300",
                border: "border-yellow-400/30",
              },
              { bg: "from-slate-400 via-slate-300 to-gray-300", icon: "text-slate-200", border: "border-slate-400/30" },
              {
                bg: "from-amber-600 via-amber-500 to-orange-500",
                icon: "text-amber-300",
                border: "border-amber-500/30",
              },
            ];

            // Gradients for cards
            const gradients = [
              "from-blue-600 via-blue-500 to-cyan-400",
              "from-purple-600 via-purple-500 to-pink-500",
              "from-orange-500 via-red-500 to-pink-600",
              "from-emerald-500 via-teal-500 to-cyan-500",
              "from-indigo-600 via-blue-600 to-purple-600",
            ];
            const gradient = gradients[topic.id % gradients.length];

            // Format end date
            const formatEndDate = (dateString?: string) => {
              if (!dateString) return null;
              const endDate = new Date(dateString);
              const now = new Date();

              // Calculate difference in milliseconds
              const diffTime = endDate.getTime() - now.getTime();

              // Convert to days (rounding down to calculate full days remaining)
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays < 0) return "마감";
              if (diffDays === 0) return "오늘 마감";
              if (diffDays === 1) return "내일 마감";
              return `D-${diffDays}`;
            };

            const endDateText = formatEndDate(topic.vote_end_at);

            return (
              <button
                onClick={() => onTopicSelect(topic)}
                key={topic.id}
                className={cn(
                  "group relative w-full overflow-hidden transition-all duration-500",
                  "hover:shadow-xl",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isTopThree ? "min-h-[160px]" : "min-h-[130px]"
                )}
                draggable="true"
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/json", JSON.stringify(topic));
                  e.dataTransfer.effectAllowed = "copy";
                }}
              >
                {/* Background Gradient */}
                <div
                  className={cn(
                    "absolute inset-0 bg-linear-to-br transition-all duration-700",
                    gradient,
                    "opacity-90 group-hover:opacity-100"
                  )}
                />

                {/* Content */}
                <div className="relative h-full flex flex-col p-3 text-white z-10">
                  {/* Top Row: Rank/Medal + End Date */}
                  <div className="flex items-start justify-between mb-2">
                    {/* Rank/Medal */}
                    <div className="shrink-0">
                      {isTopThree ? (
                        <div
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center",
                            "bg-linear-to-br shadow-lg border-2",
                            medalColors[rank - 1].bg,
                            medalColors[rank - 1].border
                          )}
                        >
                          <Trophy size={16} className={medalColors[rank - 1].icon} />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                          <span className="text-xs font-black">{isPopular ? rank : "•"}</span>
                        </div>
                      )}
                    </div>

                    {/* End Date Badge */}
                    {endDateText && (
                      <div className="bg-red-500/90 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-black border border-white/30 shadow-md">
                        {endDateText}
                      </div>
                    )}
                  </div>

                  {/* Topic Title */}
                  <div className="flex-1 mb-2">
                    <p
                      className={cn(
                        "font-black leading-tight line-clamp-2 drop-shadow-md",
                        isTopThree ? "text-sm" : "text-xs"
                      )}
                    >
                      {topic.display_name}
                    </p>
                    {topic.summary && isTopThree && (
                      <p className="text-[10px] text-white/70 line-clamp-1 mt-1 font-medium">{topic.summary}</p>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-2 text-[10px] text-white/80 mb-2">
                    <div className="flex items-center gap-0.5 bg-white/10 backdrop-blur-sm px-1.5 py-0.5 rounded">
                      <Users size={9} />
                      <span className="font-bold">{totalVotes.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-0.5 bg-white/10 backdrop-blur-sm px-1.5 py-0.5 rounded">
                      <MessageCircle size={9} />
                      <span className="font-bold">{topic.comment_count?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex items-center gap-0.5 bg-white/10 backdrop-blur-sm px-1.5 py-0.5 rounded">
                      <Eye size={9} />
                      <span className="font-bold">{topic.view_count.toLocaleString()}</span>
                    </div>
                    <span className="text-white/50 text-[9px] ml-auto">{formatRelativeTime(topic.published_at)}</span>
                  </div>

                  {/* Vote Bar (for top 3 only) */}
                  {/* Vote Bar removed as per user request */}

                  {/* Arrow Icon */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 transform transition-all duration-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0">
                    <ArrowRight size={16} className="text-white drop-shadow-md" />
                  </div>
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

                {/* Shine Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-linear-to-tr from-transparent via-white/10 to-transparent" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
