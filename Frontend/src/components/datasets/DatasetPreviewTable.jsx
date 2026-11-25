import React, { useState, useMemo, useRef } from 'react';
import {
  Table as TableIcon,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Loader2,
  SlidersHorizontal,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { formatBytes } from '../../services/datasetService';

const TYPE_STYLES = {
  Integer: 'bg-blue-950/80 text-blue-300 border-blue-500/40',
  Float: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
  String: 'bg-slate-800 text-slate-300 border-slate-700',
  Categorical: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
  Boolean: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
  DateTime: 'bg-pink-950/80 text-pink-300 border-pink-500/40',
  // Lowercase & alternate schema types from backend stream profiler
  number: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
  integer: 'bg-blue-950/80 text-blue-300 border-blue-500/40',
  float: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
  string: 'bg-slate-800 text-slate-300 border-slate-700',
  text: 'bg-slate-800 text-slate-300 border-slate-700',
  categorical: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
  boolean: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
  date: 'bg-pink-950/80 text-pink-300 border-pink-500/40',
  datetime: 'bg-pink-950/80 text-pink-300 border-pink-500/40',
  object: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
};

const DatasetPreviewTable = ({
  columns = [],
  rows = [],
  title = 'Dataset Preview',
  format = 'CSV',
  totalRows = null,
  fileSizeBytes = null,
  showActions = true,
  isLoading = false,
  error = null,
  onRetry = null,
  onClose = null,
  pagination = null,
  onPageChange = null,
  onPageSizeChange = null,
  onOpenMapping = null,
}) => {
  const tableContainerRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(10); // Display 10-20 records

  // Active page & page size (server-paginated or local)
  const isServerPaginated = Boolean(pagination && onPageChange);
  const currentPage = isServerPaginated ? (pagination.page || 1) : localPage;
  const pageSize = isServerPaginated ? (pagination.limit || 10) : localPageSize;

  // Compute missing cells count across columns
  const missingSummary = useMemo(() => {
    let missingTotal = 0;
    columns.forEach((col) => {
      missingTotal += col.missingCount || 0;
    });
    return missingTotal;
  }, [columns]);

  // Handle column header sort
  const handleSort = (colName) => {
    if (sortColumn === colName) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(colName);
      setSortDirection('asc');
    }
  };

  // Filter and sort rows (for client-side or current preview slice)
  const filteredRows = useMemo(() => {
    let result = [...rows];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          String(val ?? '').toLowerCase().includes(q)
        )
      );
    }

    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];

        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortDirection === 'asc'
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });
    }

    return result;
  }, [rows, searchTerm, sortColumn, sortDirection]);

  // Pagination calculation
  const totalItems = isServerPaginated
    ? (pagination.totalCount || rows.length)
    : filteredRows.length;
  const totalPages = isServerPaginated
    ? (pagination.totalPages || Math.max(1, Math.ceil(totalItems / pageSize)))
    : Math.max(1, Math.ceil(totalItems / pageSize));

  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;

  // Sliced rows (if client-paginated; if server-paginated, rows is already the slice)
  const displayRows = isServerPaginated
    ? filteredRows
    : filteredRows.slice(startIndex, startIndex + pageSize);

  // Pagination navigation handler
  const handleNavigatePage = (targetPage) => {
    const nextP = Math.max(1, Math.min(totalPages, targetPage));
    if (isServerPaginated && onPageChange) {
      onPageChange(nextP);
    } else {
      setLocalPage(nextP);
    }
  };

  // Page size change handler
  const handleChangePageSize = (newSize) => {
    const size = Number(newSize);
    if (isServerPaginated && onPageSizeChange) {
      onPageSizeChange(size);
    } else {
      setLocalPageSize(size);
      setLocalPage(1);
    }
  };

  // Scroll horizontally programmatically
  const handleScrollTable = (direction) => {
    if (tableContainerRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      tableContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Export visible rows as CSV
  const handleExportCSV = () => {
    if (columns.length === 0 || rows.length === 0) return;
    const headerRow = columns.map((c) => `"${c.name}"`).join(',');
    const bodyRows = rows.map((r) =>
      columns.map((c) => `"${r[c.name] ?? ''}"`).join(',')
    );
    const csvString = [headerRow, ...bodyRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `preview_${title.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="bg-[#0a0f24] rounded-3xl border border-cyan-500/30 p-8 shadow-2xl space-y-6 text-slate-300">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Loading Dataset Preview</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {title ? `Streaming tabular records for "${title}"...` : 'Fetching preview records and calculating schema statistics...'}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Shimmer skeleton headers */}
        <div className="space-y-3 animate-pulse">
          <div className="grid grid-cols-6 gap-3 pb-3 border-b border-slate-800">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 bg-slate-800/80 rounded-xl" />
            ))}
          </div>
          {/* Shimmer skeleton rows */}
          {[...Array(8)].map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-3 py-2 border-b border-slate-900/60">
              {[...Array(6)].map((_, j) => (
                <div key={j} className="h-5 bg-slate-800/40 rounded-lg" />
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
          <span className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Streaming byte stream from server...</span>
          </span>
          <span className="font-mono text-[11px] text-slate-500">API: /datasets/:id/preview</span>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    const errorText = typeof error === 'string' ? error : error?.message || 'Failed to retrieve preview records.';
    return (
      <div className="bg-[#0a0f24] rounded-3xl border border-rose-500/40 p-8 shadow-2xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/50">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h4 className="text-base font-bold text-white">Dataset Preview Error</h4>
          <p className="text-xs text-rose-300 leading-relaxed font-mono bg-rose-950/40 p-3 rounded-xl border border-rose-900/60 text-left">
            {errorText}
          </p>
          <p className="text-[11px] text-slate-400">
            The dataset stream could not be loaded or the server connection was interrupted. Check your network or retry.
          </p>
        </div>
        <div className="flex items-center justify-center space-x-3 pt-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Preview</span>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer border border-slate-700"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. Empty State (No Columns / Zero Data)
  if (!columns || columns.length === 0) {
    return (
      <div className="bg-[#0a0f24] rounded-3xl border border-slate-800 p-12 text-center text-slate-400">
        <TableIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h4 className="text-base font-bold text-white">No Dataset Data Available</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Upload a dataset file to view live tabular records and column stats.
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#0a0f24] rounded-3xl border border-cyan-500/25 shadow-2xl overflow-hidden flex flex-col text-slate-200 animate-fade-in">
      {/* Top Header & Metrics Bar */}
      <div className="p-5 border-b border-slate-800 bg-[#070b1c]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-white truncate max-w-md">{title}</h3>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 uppercase">
                    {format}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Displaying {displayRows.length} records • Page {validCurrentPage} of {totalPages}
                  {columns.length > 8 && (
                    <span className="text-cyan-400 font-semibold ml-2">
                      ({columns.length} columns • Horizontal scroll active)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badges & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-[#050814] border border-slate-800 flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-slate-400">Total Rows:</span>
              <span className="text-xs font-bold text-white">
                {totalRows ? Number(totalRows).toLocaleString() : totalItems.toLocaleString()}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-[#050814] border border-slate-800 flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-slate-400">Columns:</span>
              <span className="text-xs font-bold text-white">{columns.length}</span>
            </div>

            {fileSizeBytes && (
              <div className="px-3 py-1.5 rounded-xl bg-[#050814] border border-slate-800 flex items-center space-x-2">
                <span className="text-[11px] font-semibold text-slate-400">Size:</span>
                <span className="text-xs font-bold text-cyan-300">
                  {formatBytes(fileSizeBytes)}
                </span>
              </div>
            )}

            <div
              className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 ${
                missingSummary > 0
                  ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                  : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              }`}
            >
              {missingSummary > 0 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold">{missingSummary} Nulls</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold">Zero Nulls</span>
                </>
              )}
            </div>

            {onOpenMapping && (
              <button
                type="button"
                onClick={onOpenMapping}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                title="Configure Schema & Field Mapping"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Map Schema</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1 cursor-pointer"
                title="Close Preview Table"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Search, Horizontal Scroll Controls & Page Size Toolbar */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!isServerPaginated) setLocalPage(1);
              }}
              placeholder="Search in preview records..."
              className="w-full text-xs bg-[#050814] text-white placeholder-slate-500 pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 transition-all font-medium"
            />
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-between sm:justify-end">
            {/* Horizontal Scroll Quick Buttons (for wide datasets) */}
            {columns.length > 7 && (
              <div className="flex items-center space-x-1 bg-[#050814] px-2 py-1 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                <span className="hidden md:inline mr-1">Columns:</span>
                <button
                  type="button"
                  onClick={() => handleScrollTable('left')}
                  className="p-1 rounded hover:bg-white/10 text-cyan-400 hover:text-white transition-colors cursor-pointer"
                  title="Scroll Columns Left"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-xs text-white px-1">{columns.length} cols</span>
                <button
                  type="button"
                  onClick={() => handleScrollTable('right')}
                  className="p-1 rounded hover:bg-white/10 text-cyan-400 hover:text-white transition-colors cursor-pointer"
                  title="Scroll Columns Right"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Page Size Selector (10 or 20 records) */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Rows / page:</span>
              <select
                value={pageSize}
                onChange={(e) => handleChangePageSize(e.target.value)}
                className="bg-[#050814] border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value={10}>10 records</option>
                <option value={20}>20 records</option>
                <option value={50}>50 records</option>
              </select>
            </div>

            {showActions && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#050814] hover:bg-white/5 border border-slate-800 text-slate-300 hover:text-white font-medium text-xs transition-colors cursor-pointer"
                title="Export preview rows as CSV"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabular Data View with Smooth Horizontal & Vertical Scrolling */}
      <div
        ref={tableContainerRef}
        className="overflow-x-auto max-h-[540px] scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-slate-900/60 relative"
      >
        <table className="w-full text-left text-xs border-collapse min-w-full">
          <thead className="sticky top-0 z-20">
            <tr className="bg-[#080d22] border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              {/* Sticky Row Number Index Header */}
              <th className="py-3 px-4 w-12 text-center text-slate-400 font-mono bg-[#080d22] sticky left-0 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.4)]">
                #
              </th>
              {columns.map((col) => {
                const isSorted = sortColumn === col.name;
                const rawType = col.type || col.dataType || 'String';
                const typeStyle = TYPE_STYLES[rawType] || TYPE_STYLES[String(rawType).toLowerCase()] || TYPE_STYLES.String;

                return (
                  <th
                    key={col.name}
                    onClick={() => handleSort(col.name)}
                    className="py-3 px-4 select-none cursor-pointer hover:bg-cyan-500/10 transition-colors whitespace-nowrap bg-[#080d22] min-w-[150px]"
                  >
                    <div className="flex items-center justify-between space-x-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-xs">{col.name}</span>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${typeStyle}`}
                          >
                            {rawType}
                          </span>
                          {col.missingCount > 0 && (
                            <span className="text-[9px] font-semibold text-amber-400">
                              {col.missingCount} null
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-slate-500 pl-1">
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-cyan-400" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-600 hover:text-slate-400" />
                        )}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {displayRows.length > 0 ? (
              displayRows.map((row, rIdx) => {
                const rowNum = isServerPaginated
                  ? (startIndex + rIdx + 1)
                  : (startIndex + rIdx + 1);

                return (
                  <tr
                    key={rIdx}
                    className="hover:bg-cyan-500/5 transition-colors font-mono text-slate-300 group"
                  >
                    {/* Sticky Row Index Column */}
                    <td className="py-2.5 px-4 text-center text-slate-400 text-[10px] select-none bg-[#070b1c] sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.4)] font-semibold group-hover:text-cyan-300">
                      {rowNum}
                    </td>

                    {columns.map((col) => {
                      const val = row[col.name];
                      const isEmpty = val === null || val === undefined || val === '';

                      return (
                        <td key={col.name} className="py-2.5 px-4 whitespace-nowrap min-w-[150px]">
                          {isEmpty ? (
                            <span className="text-slate-600 italic font-sans text-[11px] bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-800/60">
                              null
                            </span>
                          ) : typeof val === 'number' ? (
                            <span className="text-cyan-300 font-semibold">{val}</span>
                          ) : typeof val === 'boolean' ? (
                            <span
                              className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                val
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {String(val)}
                            </span>
                          ) : (
                            <span
                              className="truncate max-w-[260px] inline-block font-sans text-xs text-white"
                              title={String(val)}
                            >
                              {String(val)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="py-16 text-center text-slate-400 font-sans"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-1 shadow-lg">
                      <TableIcon className="w-6 h-6 text-slate-400" />
                    </div>
                    {searchTerm ? (
                      <>
                        <p className="text-sm font-semibold text-white">
                          No records match search filter "{searchTerm}"
                        </p>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Try searching for a different value or clearing your active search filter.
                        </p>
                        <button
                          onClick={() => setSearchTerm('')}
                          className="mt-2 inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                        >
                          <span>Clear Filter</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-white">
                          No Preview Records Available
                        </p>
                        <p className="text-xs text-slate-400 max-w-sm">
                          This dataset schema has {columns.length} columns, but no sample records were returned from the backend storage stream.
                        </p>
                        {onRetry && (
                          <button
                            onClick={onRetry}
                            className="mt-2 inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold transition-all cursor-pointer border border-slate-700"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            <span>Reload Records</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls Footer */}
      <div className="p-4 border-t border-slate-800 bg-[#070b1c] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          Showing{' '}
          <span className="font-semibold text-white">
            {displayRows.length === 0 ? 0 : startIndex + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-white">
            {Math.min(startIndex + pageSize, totalItems)}
          </span>{' '}
          of <span className="font-semibold text-white">{totalItems}</span> preview records
          {totalRows && totalRows > totalItems && (
            <span className="text-slate-500 text-[11px] ml-1">
              ({Number(totalRows).toLocaleString()} total rows in dataset)
            </span>
          )}
        </div>

        {/* Pagination & Next-Record Navigation Controls */}
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
          {/* First Page */}
          <button
            onClick={() => handleNavigatePage(1)}
            disabled={validCurrentPage <= 1}
            className="p-1.5 rounded-lg border border-slate-800 bg-[#050814] text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="First Page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous Page / Record */}
          <button
            onClick={() => handleNavigatePage(validCurrentPage - 1)}
            disabled={validCurrentPage <= 1}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#050814] text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer font-semibold text-xs"
            title="Previous Page / Records"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center space-x-1 px-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (validCurrentPage <= 3) {
                pageNum = i + 1;
              } else if (validCurrentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = validCurrentPage - 2 + i;
              }

              const isActive = validCurrentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => handleNavigatePage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.5)] font-extrabold'
                      : 'bg-[#050814] border border-slate-800 text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Page / Record */}
          <button
            onClick={() => handleNavigatePage(validCurrentPage + 1)}
            disabled={validCurrentPage >= totalPages}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#050814] text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer font-semibold text-xs"
            title="Next Page / Records"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Last Page */}
          <button
            onClick={() => handleNavigatePage(totalPages)}
            disabled={validCurrentPage >= totalPages}
            className="p-1.5 rounded-lg border border-slate-800 bg-[#050814] text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Last Page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatasetPreviewTable;
