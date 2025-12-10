'use client';

import { useMemo } from 'react';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientPaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PAGES_PER_BLOCK = 10;

export default function ClientPaginationControls({ currentPage, totalPages, onPageChange }: ClientPaginationControlsProps) {

  const { pageNumbers, startPageOfBlock, isFirstBlock, isLastBlock } = useMemo(() => {
    const startPage = Math.floor((currentPage - 1) / PAGES_PER_BLOCK) * PAGES_PER_BLOCK + 1;
    const endPage = Math.min(startPage + PAGES_PER_BLOCK - 1, totalPages);

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return {
      pageNumbers: pages,
      startPageOfBlock: startPage,
      isFirstBlock: startPage === 1,
      isLastBlock: endPage === totalPages,
    };
  }, [currentPage, totalPages]);

  if (totalPages <= 1) {
    return null;
  }

  const handleNextBlock = () => {
    const nextBlockStartPage = startPageOfBlock + PAGES_PER_BLOCK;
    if (nextBlockStartPage <= totalPages) {
      onPageChange(nextBlockStartPage);
    }
  };

  const handlePrevBlock = () => {
    const prevBlockStartPage = startPageOfBlock - PAGES_PER_BLOCK;
    if (prevBlockStartPage >= 1) {
      onPageChange(prevBlockStartPage);
    }
  };
  
  const commonButtonClasses = "h-9 w-9 flex items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none hover:bg-accent hover:text-foreground";
  const activePageClasses = "bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/50 ring-offset-2 ring-offset-background shadow-lg shadow-primary/20";

  return (
    <nav className="flex justify-center items-center gap-2 mt-8">
      <button
        onClick={handlePrevBlock}
        disabled={isFirstBlock}
        className={commonButtonClasses}
        aria-label="Previous page block"
      >
        <ChevronsLeft size={18} />
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={commonButtonClasses}
        aria-label="Previous page"
      >
        <ChevronLeft size={18} />
      </button>
      
      <div className="flex items-center gap-2">
        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            className={cn(
              "h-9 w-9 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors",
              currentPage === pageNumber
                ? activePageClasses
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            )}
          >
            {pageNumber}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={commonButtonClasses}
        aria-label="Next page"
      >
        <ChevronRight size={18} />
      </button>
      <button
        onClick={handleNextBlock}
        disabled={isLastBlock}
        className={commonButtonClasses}
        aria-label="Next page block"
      >
        <ChevronsRight size={18} />
      </button>
    </nav>
  );
}