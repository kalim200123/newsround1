'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

interface ServerPaginationControlsProps {
  currentPage: number;
  totalPages: number;
}

export default function ServerPaginationControls({ currentPage, totalPages }: ServerPaginationControlsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="flex justify-center items-center gap-4 mt-8">
      <Link
        href={createPageURL(currentPage - 1)}
        className={`px-3 py-1 rounded-md bg-card text-foreground hover:bg-muted transition-colors ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
      >
        이전
      </Link>
      <div className="flex items-center gap-2">
        {pageNumbers.map((number) => (
          <Link
            key={number}
            href={createPageURL(number)}
            className={`w-8 h-8 rounded-full text-sm font-semibold transition-colors flex items-center justify-center ${
              currentPage === number
                ? 'bg-red-500 text-white'
                : 'bg-muted text-foreground hover:bg-muted'
            }`}
          >
            {number}
          </Link>
        ))}
      </div>
      <Link
        href={createPageURL(currentPage + 1)}
        className={`px-3 py-1 rounded-md bg-card text-foreground hover:bg-muted transition-colors ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
      >
        다음
      </Link>
    </nav>
  );
}
