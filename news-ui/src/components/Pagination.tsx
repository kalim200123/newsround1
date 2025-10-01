// src/components/Pagination.tsx
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) {
    return null; // 페이지가 하나뿐이면 페이지네이션을 표시하지 않음
  }

  // 페이지 수만큼 점을 렌더링하기 위한 배열
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="pagination-container">
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`pagination-dot ${currentPage === page ? 'active' : ''}`}
          aria-label={`Go to page ${page}`}
        />
      ))}
    </nav>
  );
};

export default Pagination;
