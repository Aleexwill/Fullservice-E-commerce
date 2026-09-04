'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange, itemLabel = 'registros' }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageStart = (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, total);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
      if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
        acc.push('...');
      }
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="font-body text-caption text-steel-500">
        Mostrando {pageStart}–{pageEnd} de {total} {itemLabel}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded p-1.5 text-steel-500 transition-colors hover:bg-steel-900 hover:text-arctic disabled:opacity-30"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 font-body text-caption text-steel-600">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`rounded px-2.5 py-1 font-body text-caption transition-colors ${
                page === p ? 'bg-blue text-white' : 'text-steel-400 hover:bg-steel-900 hover:text-arctic'
              }`}
              aria-current={page === p ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="rounded p-1.5 text-steel-500 transition-colors hover:bg-steel-900 hover:text-arctic disabled:opacity-30"
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
