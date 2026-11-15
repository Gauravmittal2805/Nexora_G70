import React, { useState, useMemo } from 'react';
import {
  Table as TableIcon,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { formatBytes } from '../../services/datasetService';

const TYPE_STYLES = {
  Integer: 'bg-blue-950/80 text-blue-300 border-blue-500/40',
  Float: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
  String: 'bg-slate-800 text-slate-300 border-slate-700',
  Categorical: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
  Boolean: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
  DateTime: 'bg-pink-950/80 text-pink-300 border-pink-500/40',
};

const DatasetPreviewTable = ({
  columns = [],
  rows = [],
  title = 'Dataset Preview',
  totalRows = null,
  fileSizeBytes = null,
  showActions = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Compute missing cells count across rows
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
    setCurrentPage(1);
  };

  // Filter and sort rows
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
  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + pageSize);

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
    link.download = `preview_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!columns || columns.length === 0) {
    return (
      <div className="bg-[#0a0f24] rounded-3xl border border-slate-800 p-12 text-center text-slate-400">
        <TableIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h4 className="text-base font-bold text-white">No Dataset Data Available</h4>
        <p className="text-xs text-slate-400 mt-1">
          Upload a file or choose a sample dataset above to view live tabular records and column stats.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0f24] rounded-3xl border border-cyan-500/20 shadow-xl overflow-hidden flex flex-col text-slate-200">
      {/* Top Header & Metrics Bar */}
      <div className="p-5 border-b border-slate-800 bg-[#070b1c]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{title}</h3>
                <p className="text-xs text-slate-400">
                  Inspect inferred schema, data types, and preview rows before training.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-[#050814] border border-slate-800 flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-slate-400">Rows:</span>
              <span className="text-xs font-bold text-white">
                {totalRows ? Number(totalRows).toLocaleString() : rows.length.toLocaleString()}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-[#050814] border border-slate-800 flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-slate-400">Columns:</span>
              <span className="text-xs font-bold text-white">{columns.length}</span>
            </div>

            {fileSizeBytes && (
              <div className="px-3 py-1.5 rounded-xl bg-[#050814] border border-slate-800 flex items-center space-x-2">
                <span className="text-[11px] font-semibold text-slate-400">Est. Size:</span>
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
                  <span className="text-xs font-bold">{missingSummary} Missing Values</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold">Zero Null Values</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search, Filter & Controls Toolbar */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search in preview records..."
              className="w-full text-xs bg-[#050814] text-white placeholder-slate-500 pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 transition-all"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {/* Page Size Selector */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <span>Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[#050814] border border-slate-800 rounded-lg px-2 py-1 text-xs font-medium text-white focus:outline-none focus:border-cyan-400"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
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

      {/* Tabular Data View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#080d22] border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 w-12 text-center text-slate-500 font-mono">#</th>
              {columns.map((col) => {
                const isSorted = sortColumn === col.name;
                const typeStyle = TYPE_STYLES[col.type] || TYPE_STYLES.String;

                return (
                  <th
                    key={col.name}
                    onClick={() => handleSort(col.name)}
                    className="py-3 px-4 select-none cursor-pointer hover:bg-cyan-500/5 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center justify-between space-x-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-white">{col.name}</span>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${typeStyle}`}
                          >
                            {col.type || 'String'}
                          </span>
                          {col.missingCount > 0 && (
                            <span className="text-[9px] font-medium text-amber-400">
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
                          <ArrowUpDown className="w-3 h-3 text-slate-600" />
                        )}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row, rIdx) => {
                const rowNum = startIndex + rIdx + 1;
                return (
                  <tr
                    key={rIdx}
                    className="hover:bg-cyan-500/5 transition-colors font-mono text-slate-300"
                  >
                    <td className="py-2.5 px-4 text-center text-slate-500 text-[10px] select-none bg-[#070b1c]/40">
                      {rowNum}
                    </td>
                    {columns.map((col) => {
                      const val = row[col.name];
                      const isEmpty = val === null || val === undefined || val === '';

                      return (
                        <td key={col.name} className="py-2.5 px-4 whitespace-nowrap">
                          {isEmpty ? (
                            <span className="text-slate-600 italic font-sans text-[11px]">
                              null
                            </span>
                          ) : typeof val === 'number' ? (
                            <span className="text-cyan-300 font-semibold">{val}</span>
                          ) : (
                            <span className="truncate max-w-[200px] inline-block font-sans text-xs text-white">
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
                  className="py-10 text-center text-slate-500 font-sans"
                >
                  No records match your search filter "{searchTerm}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-800 bg-[#070b1c] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          Showing{' '}
          <span className="font-semibold text-white">
            {totalItems === 0 ? 0 : startIndex + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-white">
            {Math.min(startIndex + pageSize, totalItems)}
          </span>{' '}
          of <span className="font-semibold text-white">{totalItems}</span> rows
          {totalRows && totalRows > rows.length && (
            <span className="text-slate-500 text-[11px] ml-1">
              (Previewing first {rows.length} records of {Number(totalRows).toLocaleString()})
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validCurrentPage <= 1}
            className="p-1.5 rounded-lg border border-slate-800 bg-[#050814] text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold px-2 text-white">
            Page {validCurrentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validCurrentPage >= totalPages}
            className="p-1.5 rounded-lg border border-slate-800 bg-[#050814] text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatasetPreviewTable;
