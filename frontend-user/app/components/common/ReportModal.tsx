'use client';

import { useState, FormEvent } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { reportComment } from '@/lib/api/comments';
import { reportChatMessage } from '@/lib/api/topics';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'comment' | 'chat';
  targetId: number;
  onReportSuccess: (message: string, reportedId: number) => void;
}

const reportReasons = [
  { value: 'SPAM', label: '스팸' },
  { value: 'FLOODING', label: '도배성' },
  { value: 'PRIVACY_DEFAMATION', label: '개인정보 침해 / 명예 훼손' },
  { value: 'ETC', label: '기타' },
];

export default function ReportModal({ isOpen, onClose, reportType, targetId, onReportSuccess }: ReportModalProps) {
  const { token } = useAuth();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedReason || !token) return;

    setIsSubmitting(true);
    try {
      let response;
      if (reportType === 'comment') {
        response = await reportComment(targetId, selectedReason, token);
      } else {
        response = await reportChatMessage(targetId, selectedReason, token);
      }
      
      onReportSuccess(response.message, targetId);
      onClose();
    } catch (error) {
      console.error(`Failed to report ${reportType}:`, error);
      onReportSuccess(`신고 처리 중 오류가 발생했습니다: ${(error as Error).message}`, targetId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-card p-6 rounded-lg shadow-xl w-full max-w-md mx-4 border border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">신고하기</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <p className="text-foreground mb-4">신고 사유를 선택해주세요:</p>
          <div className="space-y-2 mb-6">
            {reportReasons.map((reason) => (
              <label key={reason.value} className="flex items-center text-foreground cursor-pointer">
                <input
                  type="radio"
                  name="reportReason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="form-radio h-4 w-4 text-blue-500 bg-input border-border focus:ring-blue-500"
                />
                <span className="ml-3">{reason.label}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-zinc-600 transition-colors"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={!selectedReason || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              확인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
