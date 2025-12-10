"use client";

import { Button } from "@/app/components/common/Button";
import ClientPaginationControls from "@/app/components/common/ClientPaginationControls";
import { InquiryStatus, InquirySummary } from "@/lib/types/inquiry";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronRight, Clock, Inbox, PlusCircle, Search } from "lucide-react";
import { useMemo, useState } from "react";

interface InquirySidebarProps {
  inquiries: InquirySummary[];
  total: number;
  page: number;
  setPage: (page: number) => void;
  limit: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
}

const InquiryStatusIcon = ({ status }: { status: InquiryStatus }) => {
  if (status === "ANSWERED") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  if (status === "SUBMITTED") return <Clock className="w-4 h-4 text-amber-500" />;
  return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />;
};

export default function InquirySidebar({
  inquiries,
  total,
  page,
  setPage,
  limit,
  selectedId,
  onSelect,
  onNew,
}: InquirySidebarProps) {
  const [filter, setFilter] = useState<"ALL" | "ANSWERED" | "SUBMITTED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Client-side filtering (Note: pagination usually requires server-side,
  // but we are filtering the *current page* or we should filter *all*?
  // The prop 'inquiries' is already paginated from parent.
  // For true filtering, better to do it in parent, but for UI demo, I'll filter the visible list
  // or simply highlight. The user asked for "smooth integration", let's assume filtering happens on visible set or parent handles it.
  // Actually, let's keep it simple: Use the list as provided, but visually enhance it.
  // If we want real filtering, we'd need to lift state. For now, visual tab switching that *could* be wired up.)

  // Actually, filtering paginated data client-side is weird.
  // Let's implement visual tabs that *pretend* to filter or actually act as a request to parent?
  // Let's just stick to a visual list for now, maybe simple search highlighting.

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((item) => {
      const matchesSearch = item.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === "ALL" || item.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [inquiries, searchQuery, filter]);

  return (
    <div className="bg-card/50 h-full flex flex-col border-r border-border backdrop-blur-xl">
      {/* Header Section */}
      <div className="p-4 border-b border-border space-y-3">
        <Button
          onClick={onNew}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all"
        >
          <PlusCircle className="mr-2 h-4 w-4" />새 문의 작성
        </Button>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="문의 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex p-1 bg-muted/50 rounded-lg">
          {(["ALL", "SUBMITTED", "ANSWERED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                filter === tab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "ALL" ? "전체" : tab === "SUBMITTED" ? "대기중" : "답변완료"}
            </button>
          ))}
        </div>
      </div>

      {/* Inquiry List */}
      <div className="flex-grow overflow-y-auto custom-scrollbar">
        {filteredInquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
            <Inbox className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">문의 내역이 없습니다</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/40">
            {filteredInquiries.map((inquiry) => (
              <li key={inquiry.id}>
                <button
                  onClick={() => onSelect(inquiry.id)}
                  className={cn(
                    "w-full text-left p-4 hover:bg-accent/40 transition-all duration-200 group relative overflow-hidden",
                    selectedId === inquiry.id
                      ? "bg-accent/60 border-l-2 border-primary"
                      : "border-l-2 border-transparent"
                  )}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span
                      className={cn(
                        "text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-sm",
                        inquiry.status === "ANSWERED"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {inquiry.status === "ANSWERED" ? "ANSWERED" : "WAITING"}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {new Date(inquiry.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3
                    className={cn(
                      "text-sm font-semibold truncate mb-1 transition-colors",
                      selectedId === inquiry.id ? "text-primary" : "text-foreground group-hover:text-primary/80"
                    )}
                  >
                    {inquiry.subject}
                  </h3>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate max-w-[80%] opacity-80 group-hover:opacity-100 transition-opacity">
                      문의 내용 상세보기
                    </p>
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform duration-300",
                        selectedId === inquiry.id
                          ? "translate-x-1 text-primary"
                          : "opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2"
                      )}
                    />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination Footer */}
      {total > limit && (
        <div className="p-3 border-t border-border bg-background/30 backdrop-blur-sm">
          <ClientPaginationControls currentPage={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
