"use client";

import ClientPaginationControls from "@/app/components/common/ClientPaginationControls";
import ErrorMessage from "@/app/components/common/ErrorMessage";
import LoadingSpinner from "@/app/components/common/LoadingSpinner";
import InquiryDetail from "@/app/components/inquiry/InquiryDetail";
import InquiryForm from "@/app/components/inquiry/InquiryForm";
import { useAuth } from "@/app/context/AuthContext";
import { getInquiries } from "@/lib/api/inquiry";
import { InquirySummary } from "@/lib/types/inquiry";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Clock, Inbox, LayoutGrid, List as ListIcon, Plus, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function InquiryClientPage() {
  const { token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data State
  const [allInquiries, setAllInquiries] = useState<InquirySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & UI State
  const [filter, setFilter] = useState<"ALL" | "ANSWERED" | "SUBMITTED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
  const [selectedInquiryId, setSelectedInquiryId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 9; // Grid friendly number

  const fetchInquiries = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedInquiries = await getInquiries(token);
      setAllInquiries(fetchedInquiries);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "문의 내역을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading) {
      if (token) {
        fetchInquiries();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, token, router, fetchInquiries]);

  useEffect(() => {
    const idFromParams = searchParams.get("id");
    if (idFromParams === "new") {
      setIsCreating(true);
      setSelectedInquiryId(null);
    } else if (idFromParams) {
      const numericId = parseInt(idFromParams, 10);
      if (!isNaN(numericId)) {
        setSelectedInquiryId(numericId);
        setIsCreating(false);
      } else {
        setSelectedInquiryId(null);
        setIsCreating(false);
      }
    } else {
      setSelectedInquiryId(null);
      setIsCreating(false);
    }
  }, [searchParams]);

  const filteredInquiries = useMemo(() => {
    return allInquiries.filter((item) => {
      const matchesSearch = item.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === "ALL" || item.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [allInquiries, searchQuery, filter]);

  const paginatedInquiries = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return filteredInquiries.slice(start, end);
  }, [filteredInquiries, page, limit]);

  // Handlers
  const handleCardClick = (id: number) => router.push(`/inquiry?id=${id}`);
  const handleCreateClick = () => router.push("/inquiry?id=new");
  const handleBack = () => router.push("/inquiry");
  const handleSuccess = () => {
    fetchInquiries().then(() => router.push("/inquiry"));
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <ErrorMessage message={error} />
      </div>
    );
  }

  // --- Render: Main List View ---
  const renderList = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/40 backdrop-blur-md p-6 rounded-2xl border border-border/50 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            나의 문의 내역
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            총 <span className="font-semibold text-primary">{filteredInquiries.length}</span>개의 문의가 있습니다.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="제목 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
            />
          </div>
          {/* View Toggle */}
          <div className="hidden md:flex bg-background/50 border border-border rounded-xl p-1">
            <button
              onClick={() => setViewMode("GRID")}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === "GRID" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("LIST")}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === "LIST" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
          {/* Create Button */}
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>문의하기</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 pb-2">
        {(["ALL", "SUBMITTED", "ANSWERED"] as const).map((key) => {
          const label = key === "ALL" ? "전체" : key === "SUBMITTED" ? "답변 대기" : "답변 완료";
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                filter === key
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-card border-border text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Content Grid/List */}
      {paginatedInquiries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card/30 rounded-3xl border border-dashed border-border text-center">
          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
            <Inbox className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-medium text-foreground">문의 내역이 없습니다.</p>
          <p className="text-sm text-muted-foreground mt-1">새로운 문의를 등록해보세요.</p>
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-4",
            viewMode === "GRID" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}
        >
          {paginatedInquiries.map((inquiry, index) => (
            <motion.div
              key={inquiry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onClick={() => handleCardClick(inquiry.id)}
              className={cn(
                "group cursor-pointer bg-card hover:bg-card/80 border border-border hover:border-primary/30 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all relative overflow-hidden",
                viewMode === "LIST" && "flex items-center justify-between p-6"
              )}
            >
              {/* Decorative gradient blob */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors" />

              <div className="relative z-10 flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold border",
                      inquiry.status === "ANSWERED"
                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    )}
                  >
                    {inquiry.status === "ANSWERED" ? "답변 완료" : "답변 대기"}
                  </span>
                  <span className="text-xs text-muted-foreground">#{inquiry.id}</span>
                </div>

                <h3 className="text-lg font-bold text-foreground truncate pr-4 mb-1 group-hover:text-primary transition-colors">
                  {inquiry.subject}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {new Date(inquiry.created_at).toLocaleDateString()}
                </p>
              </div>

              {viewMode === "LIST" && (
                <div className="text-muted-foreground group-hover:text-primary transition-colors pl-4">
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}

              {/* Hover Action (Grid) */}
              {viewMode === "GRID" && (
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                  <div className="p-2 bg-primary text-primary-foreground rounded-full shadow-lg">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredInquiries.length > limit && (
        <div className="flex justify-center pt-8">
          <ClientPaginationControls
            currentPage={page}
            totalPages={Math.ceil(filteredInquiries.length / limit)}
            onPageChange={setPage}
          />
        </div>
      )}
    </motion.div>
  );

  return (
    <main className="container mx-auto max-w-7xl min-h-[calc(100vh-6rem)] p-4 md:p-8">
      <AnimatePresence mode="wait">
        {selectedInquiryId ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="h-full bg-card/60 backdrop-blur-xl border border-border shadow-2xl rounded-3xl overflow-hidden"
          >
            <InquiryDetail inquiryId={selectedInquiryId} onBack={handleBack} />
          </motion.div>
        ) : isCreating ? (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="max-w-4xl mx-auto bg-card/80 backdrop-blur-xl border border-border shadow-2xl rounded-3xl overflow-hidden"
          >
            <div className="p-4 border-b border-border/50">
              <button
                onClick={handleBack}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <ArrowRight className="w-4 h-4 rotate-180" /> 목록으로 돌아가기
              </button>
            </div>
            <InquiryForm onSuccess={handleSuccess} />
          </motion.div>
        ) : (
          renderList()
        )}
      </AnimatePresence>
    </main>
  );
}
