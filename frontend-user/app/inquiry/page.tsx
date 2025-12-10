import React, { Suspense } from 'react';
import InquiryClientPage from "./InquiryClientPage";
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

export default function InquiryPage() {
  return (
    // Wrap with Suspense because InquiryClientPage uses useSearchParams
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><LoadingSpinner /></div>}>
      <InquiryClientPage />
    </Suspense>
  );
}
