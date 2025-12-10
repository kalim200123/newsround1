import { Suspense } from "react";
import SearchClientPage from "./SearchClientPage";

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-background text-foreground">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
        <p className="ml-4 text-xl">검색 결과를 불러오는 중...</p>
      </div>
    }>
      <SearchClientPage />
    </Suspense>
  );
}