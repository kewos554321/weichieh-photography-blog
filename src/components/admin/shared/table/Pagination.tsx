"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemLabel?: string;
  isLoading?: boolean;
  disabled?: boolean;
  showPageNumbers?: boolean;
  maxVisiblePages?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemLabel = "items",
  isLoading = false,
  disabled = false,
  showPageNumbers = true,
  maxVisiblePages = 5,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // 計算要顯示的頁碼
  const getVisiblePages = () => {
    const pages: number[] = [];
    const half = Math.floor(maxVisiblePages / 2);

    let start = Math.max(1, currentPage - half);
    const end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    // 始終包含第一頁
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push(-1); // -1 表示省略號
    }

    // 中間頁碼
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }

    // 始終包含最後一頁
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push(-2); // -2 表示省略號
      pages.push(totalPages);
    }

    return pages;
  };

  const isDisabled = disabled || isLoading;

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* 左側：統計資訊 */}
      <div className="text-sm text-stone-600">
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </span>
        ) : totalItems !== undefined ? (
          <span>
            <span className="font-medium">{totalItems}</span> {itemLabel}
            <span className="text-stone-400 ml-1">
              · Page {currentPage} of {totalPages}
            </span>
          </span>
        ) : (
          <span className="text-stone-400">
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {/* 右側：分頁控制 */}
      <div className="flex items-center gap-1">
        {/* 上一頁 */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isDisabled}
          className="p-1.5 rounded hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* 頁碼 */}
        {showPageNumbers && (
          <div className="flex items-center">
            {getVisiblePages().map((page, index) => {
              if (page < 0) {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-1 text-stone-400 text-sm"
                  >
                    ···
                  </span>
                );
              }

              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  disabled={isDisabled}
                  className={`min-w-[28px] h-7 px-2 rounded text-sm font-medium transition-colors ${
                    page === currentPage
                      ? "bg-stone-900 text-white"
                      : "hover:bg-stone-200 text-stone-600"
                  } disabled:opacity-50`}
                >
                  {page}
                </button>
              );
            })}
          </div>
        )}

        {/* 下一頁 */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isDisabled}
          className="p-1.5 rounded hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* 載入指示器 */}
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-stone-400 ml-2" />
        )}
      </div>
    </div>
  );
}
