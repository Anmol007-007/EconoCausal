import React, { useState, useMemo } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  pageSize?: number;
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchable = false,
  searchKeys = [],
  pageSize = 10,
  className = '',
  emptyMessage = 'No records found',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebounce(search, 200);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (debouncedSearch && searchKeys.length) {
      rows = rows.filter((row) =>
        searchKeys.some((k) => String(row[k]).toLowerCase().includes(debouncedSearch.toLowerCase()))
      );
    }
    if (sortKey) {
      rows.sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey];
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [data, debouncedSearch, searchKeys, sortKey, sortDir]);

  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {searchable && (
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search..."
          className="w-full max-w-xs px-3 py-1.5 text-sm border border-[#bec8ce] dark:border-[#2a3a3f] rounded-lg bg-white dark:bg-[#1a2b30] text-[#131d20] dark:text-[#e2ecef] focus:outline-none focus:ring-2 focus:ring-[#006481]/30"
        />
      )}
      <div className="overflow-x-auto rounded-xl border border-[#bec8ce]/50 dark:border-[#2a3a3f]">
        <table className="w-full text-xs">
          <thead className="bg-[#eaf5f9] dark:bg-[#111e22]">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`px-4 py-2.5 text-left font-mono font-medium text-[#475053] dark:text-[#a8b8be] uppercase tracking-wider whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:text-[#006481] select-none' : ''} ${col.width ?? ''}`}
                >
                  {col.header}
                  {col.sortable && sortKey === col.key && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#bec8ce]/30 dark:divide-[#2a3a3f]">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-[#475053] dark:text-[#a8b8be]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr key={i} className="bg-white dark:bg-[#1a2b30] hover:bg-[#f1fbff] dark:hover:bg-[#1e303a] transition-colors">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-2 text-[#131d20] dark:text-[#e2ecef] font-mono">
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-[#475053] dark:text-[#a8b8be]">
          <span>{filtered.length} records</span>
          <div className="flex items-center gap-1">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} type="button" className="px-2 py-1 rounded hover:bg-[#eaf5f9] dark:hover:bg-[#2a3a3f] disabled:opacity-40">‹</button>
            <span className="px-2">Page {page + 1} / {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} type="button" className="px-2 py-1 rounded hover:bg-[#eaf5f9] dark:hover:bg-[#2a3a3f] disabled:opacity-40">›</button>
          </div>
        </div>
      )}
    </div>
  );
}

