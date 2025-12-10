"use client";

import { Button } from "@/app/components/common/Button";
import ErrorMessage from "@/app/components/common/ErrorMessage";
import LoadingSpinner from "@/app/components/common/LoadingSpinner";
import { useAuth } from "@/app/context/AuthContext";
import { getInquiryDetail } from "@/lib/api/inquiry";
import { InquiryDetail as InquiryDetailType } from "@/lib/types/inquiry";
import { cn } from "@/lib/utils";
import { ArrowLeft, Calendar, DownloadCloud, User } from "lucide-react";
import { useEffect, useState } from "react";

interface InquiryDetailProps {
  inquiryId: number;
  onBack: () => void;
}

export default function InquiryDetail({ inquiryId, onBack }: InquiryDetailProps) {
  const { token, logout } = useAuth();
  const [inquiry, setInquiry] = useState<InquiryDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!token || !inquiryId || isNaN(inquiryId)) return;

      setIsLoading(true);
      setError(null);
      try {
        const fetchedDetail = await getInquiryDetail(token, inquiryId);
        setInquiry(fetchedDetail);
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (String(err.message).includes("401") || String(err.message).includes("Unauthorized")) {
            alert("세션이 만료되었습니다. 다시 로그인해주세요.");
            logout();
          } else {
            setError(err.message || "문의 상세 정보를 불러오는데 실패했습니다.");
          }
        } else {
          setError("알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [token, inquiryId, logout]);

  const handleDownload = () => {
    if (!inquiry?.attachment_url) return;
    window.open(inquiry.attachment_url, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center h-full min-h-[400px]">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!inquiry) return null;

  return (
    <div className="flex flex-col h-full bg-background min-h-[600px] overflow-y-auto custom-scrollbar">
      {/* Navigation */}
      <div className="p-4 border-b border-border/50 flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur z-10">
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="gap-1 pl-0 hover:bg-transparent hover:text-primary"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-base font-semibold">목록으로</span>
        </Button>
      </div>

      <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full">
        {/* VIEW CONTAINER */}
        <div className="border-t-2 border-primary">
          {/* Header: Title */}
          <div className="bg-muted/10 p-6 border-b border-border">
            <div className="flex flex-col gap-3">
              <span
                className={cn(
                  "w-fit px-2.5 py-0.5 rounded text-[11px] font-bold border",
                  inquiry.status === "ANSWERED"
                    ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                    : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                )}
              >
                {inquiry.status === "ANSWERED" ? "답변완료" : "답변대기"}
              </span>
              <h1 className="text-2xl font-bold text-foreground leading-snug break-keep">{inquiry.subject}</h1>
            </div>
          </div>

          {/* Header: Meta */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>나 (작성자)</span>
              </span>
              <div className="h-3 w-px bg-border"></div>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{inquiry.created_at ? new Date(inquiry.created_at).toLocaleString() : "-"}</span>
              </span>
            </div>
          </div>

          {/* Body: Content */}
          <div className="p-8 min-h-[300px] text-foreground leading-relaxed whitespace-pre-wrap border-b border-border">
            {inquiry.content}
          </div>

          {/* Footer: Attachments */}
          {inquiry.attachment_url && (
            <div className="px-6 py-4 bg-muted/20 border-b border-border flex items-center gap-3">
              <span className="text-sm font-semibold text-muted-foreground w-16">첨부파일</span>
              <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2 h-9 bg-background">
                <DownloadCloud className="w-4 h-4" />
                <span className="text-sm">파일 다운로드</span>
              </Button>
            </div>
          )}
        </div>

        {/* Answer Area */}
        <div className="mt-12 space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span>답변 상세</span>
            <span className="text-xs font-normal text-muted-foreground ml-2">
              {inquiry.answer ? "담당자가 답변을 등록했습니다." : "담당자가 내용을 확인하고 있습니다."}
            </span>
          </h3>

          {inquiry.answer ? (
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shrink-0 mt-1">
                  <span className="text-primary-foreground font-bold text-sm">A</span>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap leading-relaxed text-foreground/90 font-medium">
                      {inquiry.answer.content}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2 border-t border-primary/10">
                    답변 일시: {new Date(inquiry.answer.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-muted/10 border border-dashed border-border rounded-xl p-8 text-center py-12">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl">⏳</span>
                </div>
                <p className="font-medium text-foreground">답변 대기중</p>
                <p className="text-sm text-muted-foreground">
                  관리자가 문의 내용을 검토하고 있습니다.
                  <br />
                  빠른 시일 내에 답변 드리겠습니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
