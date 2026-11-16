import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import datasetService, { formatBytes, formatDate, formatRelativeTime } from '../services/datasetService';
import DatasetPreviewTable from '../components/datasets/DatasetPreviewTable';
import {
  Database,
  UploadCloud,
  Search,
  FileSpreadsheet,
  Eye,
  Trash2,
  X,
  RefreshCw,
  HardDrive,
  Calendar,
  Layers,
  LayoutGrid,
  List,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Wifi,
  WifiOff,
} from 'lucide-react';

const DatasetsList = () => {
  const navigate = useNavigate();
  const previewSectionRef = useRef(null);

  // Dataset catalog state
  const [datasets, setDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  // Search, filter & sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'name' | 'size' | 'rows'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Preview state
  const [previewingDatasetId, setPreviewingDatasetId] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  // Notification state
  const [notification, setNotification] = useState(null);

  // Fetch datasets from Backend API
  const loadDatasets = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await datasetService.fetchDatasets();
      setDatasets(result.datasets || []);
      setIsOffline(Boolean(result.isOffline));

      if (result.isOffline) {
        setNotification({
          type: 'info',
          message: 'Connected to local workspace catalog (Backend API offline or unreachable).',
        });
      }
    } catch (err) {
      console.error('Error fetching datasets:', err);
      setError(err.message || 'Failed to fetch datasets from API.');
      // Fallback to local
      const cached = datasetService.getDatasets();
      setDatasets(cached);
      setIsOffline(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  // Handle preview toggle and fetch preview rows
  const handleTogglePreview = async (dataset, e) => {
    if (e) e.stopPropagation();

    // If already previewing this dataset, close it
    if (previewingDatasetId === dataset.id) {
      setPreviewingDatasetId(null);
      setPreviewData(null);
      return;
    }

    setPreviewingDatasetId(dataset.id);
    setPreviewLoading(true);
    setPreviewError(null);

    // Smooth scroll down to preview section
    setTimeout(() => {
      previewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);

    try {
      // Connect to paginated preview API endpoint: GET /api/datasets/:id/preview?page=1&limit=10
      const preview = await datasetService.getDatasetPreview(dataset.id, { page: 1, limit: 10 });
      setPreviewData({
        ...preview,
        datasetId: dataset.id,
        name: dataset.name,
        format: dataset.format,
        fileSizeBytes: dataset.sizeBytes,
        totalRows: dataset.rowCount,
      });
    } catch (err) {
      console.error('Failed to load dataset preview:', err);
      setPreviewError(err.message || 'Failed to retrieve preview rows.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handle server-side pagination page change
  const handlePageChange = async (newPage) => {
    if (!previewingDatasetId) return;
    setPreviewLoading(true);
    try {
      const preview = await datasetService.getDatasetPreview(previewingDatasetId, {
        page: newPage,
        limit: previewData?.pagination?.limit || 10,
      });
      setPreviewData((prev) => ({
        ...prev,
        ...preview,
      }));
    } catch (err) {
      setPreviewError(err.message || 'Failed to retrieve page.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handle server-side pagination page size change
  const handlePageSizeChange = async (newLimit) => {
    if (!previewingDatasetId) return;
    setPreviewLoading(true);
    try {
      const preview = await datasetService.getDatasetPreview(previewingDatasetId, {
        page: 1,
        limit: newLimit,
      });
      setPreviewData((prev) => ({
        ...prev,
        ...preview,
      }));
    } catch (err) {
      setPreviewError(err.message || 'Failed to change page size.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handle dataset delete
  const handleDelete = async (id, name, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete dataset "${name}"?`)) {
      try {
        const updated = await datasetService.deleteDataset(id);
        setDatasets(updated);
        if (previewingDatasetId === id) {
          setPreviewingDatasetId(null);
          setPreviewData(null);
        }
        setNotification({
          type: 'success',
          message: `Dataset "${name}" removed successfully.`,
        });
        setTimeout(() => setNotification(null), 3500);
      } catch (err) {
        console.error('Failed to delete dataset:', err);
        alert('Failed to delete dataset: ' + err.message);
      }
    }
  };

  // Collect unique formats and tags
  const allFormats = ['ALL', ...new Set(datasets.map((d) => (d.format || 'CSV').toUpperCase()))];
  const allTags = ['ALL', ...new Set(datasets.flatMap((d) => d.tags || []))];

  // Filter and sort datasets
  const filteredDatasets = datasets
    .filter((ds) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm.trim() ||
        (ds.name && ds.name.toLowerCase().includes(q)) ||
        (ds.description && ds.description.toLowerCase().includes(q)) ||
        (ds.format && ds.format.toLowerCase().includes(q)) ||
        (ds.tags && ds.tags.some((t) => t.toLowerCase().includes(q)));

      const matchesFormat =
        selectedFormat === 'ALL' ||
        (ds.format && ds.format.toUpperCase() === selectedFormat.toUpperCase());

      const matchesTag =
        selectedTag === 'ALL' || (ds.tags && ds.tags.includes(selectedTag));

      return matchesSearch && matchesFormat && matchesTag;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.uploadedAt || b.createdAt || 0) - new Date(a.uploadedAt || a.createdAt || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.uploadedAt || a.createdAt || 0) - new Date(b.uploadedAt || b.createdAt || 0);
      }
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'size') {
        return (b.sizeBytes || 0) - (a.sizeBytes || 0);
      }
      if (sortBy === 'rows') {
        return (b.rowCount || 0) - (a.rowCount || 0);
      }
      return 0;
    });

  // Calculate catalog stats
  const totalRowsCount = datasets.reduce((sum, d) => sum + (Number(d.rowCount) || 0), 0);
  const totalSizeBytes = datasets.reduce((sum, d) => sum + (Number(d.sizeBytes) || 0), 0);

  return (
    <div className="space-y-6 pb-20 text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Datasets Catalog
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              {datasets.length} Ingested
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Browse, manage, and inspect all ingested tabular data sources ready for schema analysis and preprocessing.
          </p>
        </div>

        {/* Action Buttons & Status */}
        <div className="flex items-center space-x-3 self-start md:self-auto flex-wrap gap-y-2">
          {/* Connection Status Pill */}
          <div
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border ${
              isOffline
                ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
            }`}
            title={isOffline ? 'Using local offline storage' : 'Connected to Backend API (:5000)'}
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Offline Catalog</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>API Connected</span>
              </>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadDatasets(true)}
            disabled={isRefreshing || isLoading}
            className="p-2.5 rounded-xl bg-[#0a0f24] hover:bg-white/5 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
            title="Refresh datasets from API"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Upload Button */}
          <button
            onClick={() => navigate('/dashboard/datasets/upload')}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Dataset</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-semibold animate-fade-in border ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/40'
              : 'bg-cyan-950/80 text-cyan-200 border-cyan-500/40'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Catalog Overview Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#0a0f24] border border-cyan-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
            <span>Total Datasets</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-extrabold text-white">{datasets.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a0f24] border border-cyan-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
            <span>Total Rows</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-extrabold text-white">
            {totalRowsCount.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a0f24] border border-cyan-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
            <span>Total Storage</span>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-extrabold text-white">
            {formatBytes(totalSizeBytes)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a0f24] border border-cyan-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
            <span>Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400">All Ready</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-[#0a0f24] rounded-2xl border border-cyan-500/20 p-4 shadow-lg flex flex-col gap-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search datasets by name, format, tag..."
              className="w-full text-xs bg-[#070b1c] text-white placeholder-slate-500 pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 transition-all font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls: Sort Dropdown & View Mode Switcher */}
          <div className="flex items-center space-x-2 w-full md:w-auto justify-between md:justify-end">
            {/* Sort Selector */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <span className="hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#070b1c] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
                <option value="size">Size (Largest)</option>
                <option value="rows">Rows (Most)</option>
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-[#070b1c] p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="List Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Format & Tag Filter Chips */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">Format:</span>
            {allFormats.map((fmt) => (
              <button
                key={fmt}
                onClick={() => setSelectedFormat(fmt)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedFormat === fmt
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-[#070b1c] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          {allTags.length > 1 && (
            <div className="flex items-center space-x-1.5 shrink-0">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">Tag:</span>
              {allTags.slice(0, 6).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-[#070b1c] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error Alert State */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 shadow-xl flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-white">Dataset API Error</h4>
              <p className="text-xs text-rose-300 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={() => loadDatasets(true)}
            className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-[#0a0f24] rounded-3xl border border-slate-800 p-5 space-y-4 animate-pulse"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-800" />
                <div className="h-5 w-16 bg-slate-800 rounded-full" />
              </div>
              <div className="h-5 w-3/4 bg-slate-800 rounded" />
              <div className="h-3 w-full bg-slate-800/60 rounded" />
              <div className="h-3 w-2/3 bg-slate-800/60 rounded" />
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="h-4 w-24 bg-slate-800 rounded" />
                <div className="h-8 w-20 bg-slate-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredDatasets.length > 0 ? (
        /* View Mode 1: Grid Cards */
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDatasets.map((ds) => {
              const isSelected = previewingDatasetId === ds.id;
              const formattedDate = formatDate(ds.uploadedAt || ds.createdAt);
              const relativeTime = formatRelativeTime(ds.uploadedAt || ds.createdAt);

              return (
                <div
                  key={ds.id}
                  onClick={(e) => handleTogglePreview(ds, e)}
                  className={`bg-[#0a0f24] rounded-3xl border transition-all duration-200 p-5 cursor-pointer relative flex flex-col justify-between group ${
                    isSelected
                      ? 'border-cyan-400 ring-2 ring-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.3)] bg-[#0d1538]'
                      : 'border-slate-800 hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  }`}
                >
                  <div>
                    {/* Header Strip: Icon, Format Badge & Status Badge */}
                    <div className="flex items-start justify-between mb-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#070b1c] text-cyan-300 border border-slate-700 uppercase tracking-wider">
                          {ds.format || 'CSV'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                          {ds.status || 'Ready'}
                        </span>
                      </div>
                    </div>

                    {/* Dataset Name */}
                    <h3
                      className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate"
                      title={ds.name}
                    >
                      {ds.name}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {ds.description || 'Ingested dataset ready for schema analysis & preprocessing.'}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(ds.tags || []).slice(0, 3).map((t, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#070b1c] text-slate-300 border border-slate-800"
                        >
                          {t}
                        </span>
                      ))}
                      {(ds.tags || []).length > 3 && (
                        <span className="text-[10px] text-slate-500 px-1 py-0.5">
                          +{ds.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comprehensive Metadata: Name, Type, Size, Upload Date, Rows/Cols */}
                  <div className="mt-5 pt-4 border-t border-slate-800 space-y-2.5 text-xs text-slate-400">
                    {/* Rows & Size */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">
                        {Number(ds.rowCount).toLocaleString()} rows • {ds.columnCount || ds.columns?.length || 0} cols
                      </span>
                      <span className="font-mono text-cyan-300 font-semibold flex items-center space-x-1">
                        <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                        <span>{formatBytes(ds.sizeBytes || ds.fileSize || 0)}</span>
                      </span>
                    </div>

                    {/* Upload Date */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center space-x-1 truncate max-w-[190px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span title={formattedDate}>{formattedDate}</span>
                      </span>
                      {relativeTime && (
                        <span className="text-slate-500 font-medium shrink-0">
                          {relativeTime}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center justify-between border-t border-slate-800/60 gap-1.5">
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleTogglePreview(ds, e)}
                          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                              : 'bg-cyan-950/80 text-cyan-300 hover:bg-cyan-900 border border-cyan-500/30'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isSelected ? 'Close' : 'Preview'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/datasets/${ds.id}`);
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#070b1c] text-cyan-300 hover:text-white hover:bg-cyan-950 border border-cyan-500/30 transition-all cursor-pointer"
                          title="Dataset Details & Profiling"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>Profile</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/datasets/mapping?datasetId=${ds.id}`);
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#070b1c] text-indigo-300 hover:text-white hover:bg-indigo-950 border border-indigo-500/30 transition-all cursor-pointer"
                          title="Map source columns to target schema"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Map</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(ds.id, ds.name, e)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete dataset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* View Mode 2: Table List View */
          <div className="bg-[#0a0f24] rounded-3xl border border-cyan-500/20 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#070b1c] border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="py-3.5 px-4">Dataset Name</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Size</th>
                    <th className="py-3.5 px-4">Upload Date</th>
                    <th className="py-3.5 px-4">Rows / Columns</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredDatasets.map((ds) => {
                    const isSelected = previewingDatasetId === ds.id;
                    const formattedDate = formatDate(ds.uploadedAt || ds.createdAt);

                    return (
                      <tr
                        key={ds.id}
                        onClick={(e) => handleTogglePreview(ds, e)}
                        className={`hover:bg-cyan-500/5 transition-colors cursor-pointer ${
                          isSelected ? 'bg-cyan-500/10' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                              <FileSpreadsheet className="w-4 h-4" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="font-bold text-white truncate max-w-xs">{ds.name}</div>
                              <div className="text-[11px] text-slate-400 truncate max-w-xs">{ds.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#070b1c] text-cyan-300 border border-slate-700 uppercase">
                            {ds.format || 'CSV'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-cyan-300 font-semibold">
                          {formatBytes(ds.sizeBytes || ds.fileSize || 0)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-300 whitespace-nowrap">
                          {Number(ds.rowCount).toLocaleString()} rows • {ds.columnCount || ds.columns?.length || 0} cols
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                            {ds.status || 'Ready'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => handleTogglePreview(ds, e)}
                              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-cyan-500 text-slate-950'
                                  : 'text-cyan-400 hover:bg-cyan-950 border border-cyan-500/30'
                              }`}
                              title="Toggle Preview Table"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/dashboard/datasets/${ds.id}`)}
                              className="p-1.5 rounded-lg text-xs font-semibold text-cyan-300 hover:text-white hover:bg-cyan-950 border border-cyan-500/30 transition-colors cursor-pointer"
                              title="Dataset Details & Profiling"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/dashboard/datasets/mapping?datasetId=${ds.id}`)}
                              className="p-1.5 rounded-lg text-xs font-semibold text-indigo-300 hover:text-white hover:bg-indigo-950 border border-indigo-500/30 transition-colors cursor-pointer"
                              title="Field Mapping Studio"
                            >
                              <Layers className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDelete(ds.id, ds.name, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete dataset"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="bg-[#0a0f24] rounded-3xl border border-slate-800 p-12 text-center">
          <Database className="w-14 h-14 text-slate-600 mx-auto mb-4" />
          {searchTerm || selectedFormat !== 'ALL' || selectedTag !== 'ALL' ? (
            <div>
              <h3 className="text-base font-bold text-white">No Datasets Match Your Filter</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-6">
                No datasets matched "{searchTerm}" with the active format & tag filters.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedFormat('ALL');
                  setSelectedTag('ALL');
                }}
                className="px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-base font-bold text-white">No Datasets Ingested Yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto mb-6 leading-relaxed">
                Get started by uploading your first CSV, TSV, or JSON dataset to explore schemas and preview records.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => navigate('/dashboard/datasets/upload')}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload First Dataset</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Dataset Preview Table Section */}
      <div ref={previewSectionRef} className="pt-2">
        {previewingDatasetId && (
          <div className="space-y-3 animate-fade-in">
            <DatasetPreviewTable
              columns={previewData?.columns || []}
              rows={previewData?.rows || []}
              title={previewData?.name || 'Dataset Preview'}
              format={previewData?.format || 'CSV'}
              totalRows={previewData?.totalRows}
              fileSizeBytes={previewData?.fileSizeBytes}
              isLoading={previewLoading}
              error={previewError}
              pagination={previewData?.pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onOpenMapping={() => navigate(`/dashboard/datasets/mapping?datasetId=${previewingDatasetId}`)}
              onRetry={() => {
                const ds = datasets.find((d) => d.id === previewingDatasetId);
                if (ds) handleTogglePreview(ds);
              }}
              onClose={() => {
                setPreviewingDatasetId(null);
                setPreviewData(null);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetsList;
