"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { getInquiries } from '@/lib/api/inquiry';
import { InquirySummary } from '@/lib/types/inquiry';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import ErrorMessage from '@/app/components/common/ErrorMessage';
import ClientPaginationControls from '@/app/components/common/ClientPaginationControls';
import InquiryDetail from '../inquiry/InquiryDetail';

export default function InquiryHistory() {
  const { token, logout } = useAuth();
  const [allInquiries, setAllInquiries] = useState<InquirySummary[]>([]);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInquiryId, setSelectedInquiryId] = useState<number | null>(null);

  const paginatedInquiries = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return allInquiries.slice(start, end);
  }, [allInquiries, page, limit]);

  const totalPages = useMemo(() => {
    return Math.ceil(allInquiries.length / limit);
  }, [allInquiries.length, limit]);


  useEffect(() => {
    const fetchInquiries = async () => {
      if (!token) {
        setError("로그인이 필요합니다.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await getInquiries(token);
        setAllInquiries(data || []);
      } catch (err: unknown) {
        console.error("Failed to fetch inquiries:", err);
        if (err instanceof Error) {
          if (String(err.message).includes("401") || String(err.message).includes("Unauthorized")) {
            alert("세션이 만료되었습니다. 다시 로그인해주세요.");
            logout();
          } else {
            setError(err.message || "문의 내역을 불러오는데 실패했습니다.");
          }
        } else {
          setError("알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchInquiries();
  }, [token, logout]);

  const StatusBadge = ({ status }: { status: InquirySummary['status'] }) => {
    const statusMap = {
      SUBMITTED: { text: '답변 대기', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
      ANSWERED: { text: '답변 완료', className: 'bg-green-500/10 text-green-600 dark:text-green-400' },
      CLOSED: { text: '종료됨', className: 'bg-secondary text-muted-foreground' },
    };
    const currentStatus = statusMap[status as keyof typeof statusMap] || statusMap.CLOSED;
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${currentStatus.className}`}>
        {currentStatus.text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48 p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <div className="p-8"><ErrorMessage message={error} /></div>;
  }
  
  if (selectedInquiryId) {
    return <InquiryDetail inquiryId={selectedInquiryId} onBack={() => setSelectedInquiryId(null)} />;
  }

  return (
    <div className="p-6 sm:p-8 space-y-4">
      <h2 className="text-2xl font-bold text-foreground mb-4">문의 내역</h2>
      {allInquiries.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">제출된 문의가 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {paginatedInquiries.map((inquiry) => (
            <li
              key={inquiry.id}
              className="bg-card-foreground/5 p-4 rounded-lg shadow-sm border border-border cursor-pointer hover:bg-accent transition-colors"
              onClick={() => setSelectedInquiryId(inquiry.id)}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-lg font-semibold text-foreground">{inquiry.subject}</span>
                <StatusBadge status={inquiry.status} />
              </div>
              <p className="text-sm text-muted-foreground">제출일: {new Date(inquiry.created_at).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      )}
      {totalPages > 1 && (
        <div className="pt-4">
          <ClientPaginationControls
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
        </div>
      )}
    </div>
  );
}
