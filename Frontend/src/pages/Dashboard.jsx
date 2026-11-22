import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFirstName } from '../utils/userUtils';
import datasetService, { formatBytes, formatDate, formatRelativeTime } from '../services/datasetService';
import DatasetPreviewTable from '../components/datasets/DatasetPreviewTable';
import {
  UploadCloud,
  Database,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  Activity,
  HardDrive,
  Cpu,
  Search,
  Layers,
  BarChart3,
  Eye,
  TrendingUp,
  Trash2,
  LayoutGrid,
  List,
  RefreshCw,
  AlertCircle,
  Calendar,
  X,
  Wifi,
  WifiOff,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const previewSectionRef = useRef(null);

  // Dataset listing & API states
  const [datasets, setDatasets] = useState(() => datasetService.getDatasets());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [notification, setNotification] = useState(null);

  // Search, filter & view layout mode ('table' | 'grid')
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Dataset preview states
  const [previewingDatasetId, setPreviewingDatasetId] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  // Connect the dashboard with the dataset listing API: GET /api/datasets
  const loadDatasets = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await datasetService.fetchDatasets();
      const datasetList = result.datasets || [];
      setDatasets(datasetList);
      setIsOffline(Boolean(result.isOffline));

      if (isManualRefresh) {
        setNotification({
          type: 'success',
          message: `Synchronized ${datasetList.length} datasets from API.`,
        });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error('Failed to load datasets on dashboard:', err);
      setError(err.message || 'Failed to fetch datasets from API.');
      // Fallback to local catalog
      const cached = datasetService.getDatasets();
      setDatasets(cached);
      setIsOffline(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch on mount & auto-poll interval
  useEffect(() => {
    let active = true;
    loadDatasets();

    const interval = setInterval(() => {
      if (active) {
        datasetService
          .fetchDatasets()
          .then((result) => {
            if (active && result?.datasets) {
              setDatasets(result.datasets);
              setIsOffline(Boolean(result.isOffline));
            }
          })
          .catch(() => {});
      }
    }, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [loadDatasets]);

  // Handle dataset deletion: DELETE /api/datasets/:id
  const handleDeleteDataset = async (id, name, e) => {
    if (e) e.stopPropagation();
    const confirmed = window.confirm(
      `Are you sure you want to delete dataset "${name}"?\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const updated = await datasetService.deleteDataset(id);
      setDatasets(updated);

      // Close preview if the deleted dataset was open
      if (previewingDatasetId === id) {
        setPreviewingDatasetId(null);
        setPreviewData(null);
      }

      setNotification({
        type: 'success',
        message: `Dataset "${name}" was deleted successfully.`,
      });
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error('Failed to delete dataset:', err);
      setNotification({
        type: 'error',
        message: `Failed to delete dataset "${name}": ${err.message}`,
      });
    }
  };

  // Handle dataset preview toggle & streaming preview rows: GET /api/datasets/:id/preview
  const handleTogglePreview = async (dataset, e) => {
    if (e) e.stopPropagation();

    // Toggle off if clicking the already open dataset
    if (previewingDatasetId === dataset.id) {
      setPreviewingDatasetId(null);
      setPreviewData(null);
      return;
    }

    setPreviewingDatasetId(dataset.id);
    setPreviewLoading(true);
    setPreviewError(null);

    // Smooth scroll down to preview container
    setTimeout(() => {
      previewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);

    try {
      const preview = await datasetService.getDatasetPreview(dataset.id, { page: 1, limit: 10 });
      setPreviewData({
        ...preview,
        datasetId: dataset.id,
        name: dataset.name,
        fileName: dataset.fileName || dataset.name,
        format: dataset.format,
        fileSizeBytes: dataset.sizeBytes || dataset.fileSize,
        totalRows: dataset.rowCount,
      });
    } catch (err) {
      console.error('Failed to load dataset preview:', err);
      setPreviewError(err.message || 'Failed to retrieve preview rows from server.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handle preview pagination page change
  const handlePreviewPageChange = async (newPage) => {
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

  // Handle preview pagination page size change
  const handlePreviewSizeChange = async (newLimit) => {
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

  // Statistical calculations across all ingested datasets
  const totalRecords = datasets.reduce(
    (acc, d) => acc + (d.rowCount || (d.metadata && d.metadata.rowCount) || 0),
    0
  );
  const totalSizeBytes = datasets.reduce(
    (acc, d) => acc + (d.sizeBytes || d.fileSize || 0),
    0
  );
  const totalColumns = datasets.reduce(
    (acc, d) => acc + (d.columns?.length || d.columnCount || 0),
    0
  );

  const totalNulls = datasets.reduce(
    (acc, d) =>
      acc + (d.columns?.reduce((cAcc, col) => cAcc + (col.missingCount || 0), 0) || 0),
    0
  );
  const totalEstimatedCells = datasets.reduce(
    (acc, d) =>
      acc + (d.rowCount || 0) * (d.columns?.length || d.columnCount || 1),
    0
  );
  const hasDatasets = datasets.length > 0;
  const healthPercentage =
    hasDatasets && totalEstimatedCells > 0
      ? Math.min(
          100,
          Math.max(
            50,
            Math.round(((totalEstimatedCells - totalNulls) / totalEstimatedCells) * 100)
          )
        )
      : 0;

  // Filter datasets by search query and file format
  const filteredDatasets = datasets.filter((d) => {
    const q = searchFilter.toLowerCase();
    const nameMatch = (d.name && d.name.toLowerCase().includes(q)) || (d.fileName && d.fileName.toLowerCase().includes(q));
    const descMatch = d.description?.toLowerCase().includes(q);
    const matchesSearch = !searchFilter.trim() || nameMatch || descMatch;
    const matchesFormat =
      selectedFormat === 'ALL' || (d.format && d.format.toUpperCase() === selectedFormat);
    return matchesSearch && matchesFormat;
  });

  return (
    <div className="space-y-8 pb-12 animate-fade-in text-slate-100">
      {/* ========================================================= */}
      {/* TOP WELCOME HERO BANNER (Nexux Cosmic Gradient Style) */}
      {/* ========================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1430] via-[#091026] to-[#14123b] p-8 sm:p-10 border border-cyan-500/25 shadow-2xl">
        {/* Swirling electric ribbon glows */}
        <div className="absolute -right-16 -bottom-16 w-96 h-96 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -left-16 -top-16 w-80 h-80 bg-purple-500/15 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/70 text-cyan-300 text-xs font-semibold border border-cyan-500/30 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Nexora Workspace Active • Real-Time Data Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Welcome back,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-purple-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                {getFirstName(user)}
              </span>
              ! 👋
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Your high-throughput dataset platform is operational. Ingest tabular data, inspect inferred schemas, and analyze data quality in real time.
            </p>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/dashboard/datasets/upload"
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload New Dataset</span>
            </Link>
            <Link
              to="/dashboard/datasets"
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-full bg-[#0d1636] hover:bg-[#121e4a] text-slate-200 font-semibold text-xs border border-cyan-500/30 transition-all cursor-pointer"
            >
              <Database className="w-4 h-4 text-cyan-400" />
              <span>View Datasets Catalog</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4 TOP KPI STATS (Nexux Dark Style with Glowing Accents) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Ingested Datasets */}
        <div className="bg-[#0a0f24] rounded-3xl border border-slate-800 p-5 shadow-lg hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Ingested Datasets
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {datasets.length}
          </div>
          <div className="flex items-center text-xs text-cyan-400 mt-2 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-cyan-400" />
            <span>{hasDatasets ? 'Ready for Preprocessing' : 'Awaiting Ingestion'}</span>
          </div>
        </div>

        {/* Total Records */}
        <div className="bg-[#0a0f24] rounded-3xl border border-slate-800 p-5 shadow-lg hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Records Indexed
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {totalRecords.toLocaleString()}
          </div>
          <div className="flex items-center text-xs text-slate-400 mt-2 font-medium">
            <span>{hasDatasets ? 'Across all tabular streams' : 'No records indexed'}</span>
          </div>
        </div>

        {/* Storage Size */}
        <div className="bg-[#0a0f24] rounded-3xl border border-slate-800 p-5 shadow-lg hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Storage Footprint
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {formatBytes(totalSizeBytes)}
          </div>
          <div className="flex items-center text-xs text-purple-400 mt-2 font-medium">
            <span>{hasDatasets ? 'High-speed cached memory' : '0 B storage allocated'}</span>
          </div>
        </div>

        {/* Model Accuracy Benchmark */}
        <div className="bg-[#0a0f24] rounded-3xl border border-pink-500/40 p-5 shadow-lg hover:shadow-[0_0_20px_rgba(236,72,153,0.15)] transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Data Quality & Health
            </span>
            <div className="w-9 h-9 rounded-xl bg-pink-950/80 border border-pink-500/30 text-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{healthPercentage}%</div>
          <div className="flex items-center text-xs text-pink-400 mt-2 font-medium">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            <span>{hasDatasets ? 'Live Validation Index' : 'Awaiting Data Upload'}</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* NEXUX DASHBOARD WIDGETS (Radial Gauges & Stream Wave Chart) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Interactive Stream Wave Chart (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-[#0a0f24] rounded-3xl border border-cyan-500/20 p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Ingestion Stream & Memory Analysis
                </h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                    hasDatasets
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {hasDatasets ? 'Live Stream' : 'Stream Inactive'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time chunked ingestion throughput and RAM buffer allocation.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className={`flex items-center font-semibold ${hasDatasets ? 'text-cyan-400' : 'text-slate-500'}`}>
                <span className={`w-2 h-2 rounded-full mr-1.5 ${hasDatasets ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                Throughput (MB/s)
              </span>
              <span className={`flex items-center font-semibold ml-2 ${hasDatasets ? 'text-purple-400' : 'text-slate-500'}`}>
                <span className={`w-2 h-2 rounded-full mr-1.5 ${hasDatasets ? 'bg-purple-400' : 'bg-slate-600'}`} />
                CPU Core Load
              </span>
            </div>
          </div>

          {/* SVG Wave Chart matching Nexux theme */}
          <div className="h-56 w-full relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cyanWaveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#060813" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="purpleWaveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#060813" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid guide lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="#1e293b" strokeDasharray="3 3" />

              {hasDatasets ? (
                <>
                  {/* Secondary wave path (purple) */}
                  <path
                    d="M0,130 Q70,95 130,110 T260,85 T380,95 T500,75 L500,160 L0,160 Z"
                    fill="url(#purpleWaveGrad)"
                  />
                  <path
                    d="M0,130 Q70,95 130,110 T260,85 T380,95 T500,75"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2"
                  />

                  {/* Primary wave path (cyan) */}
                  <path
                    d="M0,140 Q60,70 120,90 T240,40 T360,65 T500,25 L500,160 L0,160 Z"
                    fill="url(#cyanWaveGrad)"
                  />
                  <path
                    d="M0,140 Q60,70 120,90 T240,40 T360,65 T500,25"
                    fill="none"
                    stroke="#00d2ff"
                    strokeWidth="2.5"
                    filter="drop-shadow(0 0 6px rgba(0,210,255,0.6))"
                  />

                  {/* Active Pulsing Point */}
                  <circle cx="240" cy="40" r="4" fill="#00d2ff" className="animate-ping" />
                  <circle cx="240" cy="40" r="3" fill="#ffffff" />
                </>
              ) : (
                <line
                  x1="0"
                  y1="145"
                  x2="500"
                  y2="145"
                  stroke="#334155"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
              )}
            </svg>

            {/* Empty Stream Overlay when no datasets */}
            {!hasDatasets && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-[#0a0f24]/75 backdrop-blur-[2px] rounded-2xl">
                <div className="w-10 h-10 rounded-2xl bg-cyan-950/60 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2">
                  <Activity className="w-5 h-5 text-slate-500" />
                </div>
                <p className="text-sm font-bold text-white">Stream Inactive (0 Active Ingestions)</p>
                <p className="text-xs text-slate-400 max-w-sm mt-0.5">
                  Real-time throughput and memory buffer curves will activate once you upload a dataset.
                </p>
                <Link
                  to="/dashboard/datasets/upload"
                  className="mt-3 inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm transition-all"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Dataset</span>
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800">
            <span>00:00 (Buffer Init)</span>
            <span>06:00 (Ingestion Peak)</span>
            <span>12:00 (Preprocessing)</span>
            <span>18:00 (Analytics Ready)</span>
            <span>24:00 (Cached)</span>
          </div>
        </div>

        {/* Right: Circular / Radial Gauges (lg:col-span-4) */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          {/* Gauge 1: Data Quality Score */}
          <div className="bg-[#0a0f24] rounded-3xl border border-cyan-500/20 p-5 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Data Quality Score
              </span>
              <div className="text-xl font-extrabold text-white mt-1">
                {hasDatasets ? `${healthPercentage}%` : '0%'}
              </div>
              <p className="text-[11px] text-cyan-400 mt-0.5 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                {hasDatasets ? 'Real-Time Completeness' : 'Awaiting Data Upload'}
              </p>
            </div>

            {/* Circular Gauge SVG */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-cyan-400"
                  strokeDasharray={`${hasDatasets ? healthPercentage : 0}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  filter="drop-shadow(0 0 4px rgba(6,182,212,0.8))"
                />
              </svg>
              <span className="absolute font-bold text-xs text-white">
                {hasDatasets ? `${healthPercentage}%` : '0%'}
              </span>
            </div>
          </div>

          {/* Gauge 2: Inferred Columns & Schema Structure */}
          <div className="bg-[#0a0f24] rounded-3xl border border-purple-500/20 p-5 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Inferred Columns
              </span>
              <div className="text-xl font-extrabold text-white mt-1">
                {hasDatasets ? `${totalColumns} Columns` : '0 Columns'}
              </div>
              <p className="text-[11px] text-purple-400 mt-0.5 flex items-center">
                <Layers className="w-3 h-3 mr-1" />
                {hasDatasets
                  ? totalNulls === 0
                    ? 'Zero Nulls • Auto-Typed'
                    : `${totalNulls} Nulls Detected`
                  : 'No Columns Indexed'}
              </p>
            </div>

            {/* Circular Gauge SVG */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-purple-400"
                  strokeDasharray={`${hasDatasets ? Math.min(100, Math.max(25, totalColumns * 12)) : 0}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  filter="drop-shadow(0 0 4px rgba(168,85,247,0.8))"
                />
              </svg>
              <span className="absolute font-bold text-xs text-white">
                {hasDatasets ? totalColumns : '0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* INGESTED DATASETS CATALOG (Connected to Backend Listing API) */}
      {/* Table & Card Layout with Filename, Type, Size, Upload Date, Delete & Preview */}
      {/* ========================================================= */}
      <div className="bg-[#0a0f24] rounded-3xl border border-cyan-500/20 shadow-xl overflow-hidden">
        {/* Header & Filter Controls */}
        <div className="p-6 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#070b1c]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-base font-bold text-white">Ingested Datasets Catalog</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  {datasets.length} Available
                </span>
                {/* Connection Status Indicator */}
                <span
                  className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    isOffline
                      ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                  }`}
                  title={isOffline ? 'Using local offline storage' : 'Connected to Backend API'}
                >
                  {isOffline ? (
                    <>
                      <WifiOff className="w-3 h-3 text-amber-400" />
                      <span>Offline</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-3 h-3 text-emerald-400" />
                      <span>API Live</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect schemas, view live records, and manage uploaded data sources.
              </p>
            </div>
          </div>

          {/* Interactive Search, Filter, Layout Switcher & Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search datasets..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-800 bg-[#050814] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-40 sm:w-48 font-medium"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2.5 top-2 text-slate-500 hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Format Filter Chips */}
            <div className="flex items-center space-x-1 bg-[#050814] p-1 rounded-xl text-xs font-semibold border border-slate-800">
              {['ALL', 'CSV', 'JSON'].map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setSelectedFormat(fmt)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedFormat === fmt
                      ? 'bg-cyan-600 text-white shadow-xs font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            {/* View Mode Switcher: Table vs Card Layout */}
            <div className="flex items-center bg-[#050814] p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Table Layout"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Card Layout"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh from API Button */}
            <button
              type="button"
              onClick={() => loadDatasets(true)}
              disabled={isRefreshing || isLoading}
              className="p-2 rounded-xl bg-[#050814] hover:bg-white/5 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
              title="Refresh datasets from API"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            {/* Upload Button */}
            <Link
              to="/dashboard/datasets/upload"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload</span>
            </Link>
          </div>
        </div>

        {/* Notification Toast Alert */}
        {notification && (
          <div
            className={`mx-6 mt-4 p-3 rounded-2xl flex items-center justify-between text-xs font-semibold animate-fade-in border ${
              notification.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/40'
                : 'bg-rose-950/80 text-rose-200 border-rose-500/40'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Error Alert with Retry */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadDatasets(true)}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Content: Loading Skeleton OR Table Layout OR Card Layout OR Empty State */}
        <div className="p-6">
          {isLoading ? (
            /* Loading Skeleton State */
            <div className="space-y-4 py-4 animate-pulse">
              <div className="grid grid-cols-6 gap-4 pb-3 border-b border-slate-800">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-6 bg-slate-800/80 rounded-lg" />
                ))}
              </div>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="grid grid-cols-6 gap-4 py-3 border-b border-slate-900/60">
                  {[...Array(6)].map((_, j) => (
                    <div key={j} className="h-5 bg-slate-800/40 rounded" />
                  ))}
                </div>
              ))}
            </div>
          ) : filteredDatasets.length > 0 ? (
            viewMode === 'table' ? (
              /* ========================================================= */
              /* LAYOUT 1: TABLE VIEW (Filename, Type, Size, Upload Date, Actions) */
              /* ========================================================= */
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead className="bg-[#070b1c] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-y border-slate-800">
                    <tr>
                      <th className="py-3 px-6">Filename / Dataset</th>
                      <th className="py-3 px-6">File Type</th>
                      <th className="py-3 px-6">File Size</th>
                      <th className="py-3 px-6">Upload Date</th>
                      <th className="py-3 px-6">Rows / Columns</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredDatasets.map((dataset) => {
                      const isPreviewActive = previewingDatasetId === dataset.id;
                      const formattedDate = formatDate(dataset.uploadedAt || dataset.createdAt);
                      const relativeTime = formatRelativeTime(dataset.uploadedAt || dataset.createdAt);
                      const fileNameDisplay = dataset.fileName || dataset.name || 'Untitled';
                      const formatDisplay = (dataset.fileType || dataset.format || 'CSV').toUpperCase();

                      return (
                        <tr
                          key={dataset.id}
                          onClick={(e) => handleTogglePreview(dataset, e)}
                          className={`hover:bg-cyan-500/5 transition-colors cursor-pointer group ${
                            isPreviewActive ? 'bg-cyan-500/10' : ''
                          }`}
                        >
                          {/* Filename & Name */}
                          <td className="py-4 px-6 font-semibold text-white">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                <FileSpreadsheet className="w-4 h-4" />
                              </div>
                              <div className="overflow-hidden">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-white group-hover:text-cyan-300 transition-colors truncate max-w-xs" title={fileNameDisplay}>
                                    {fileNameDisplay}
                                  </span>
                                  {dataset.tags && dataset.tags.length > 0 && (
                                    <span className="text-[10px] bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded border border-slate-700 shrink-0">
                                      {dataset.tags[0]}
                                    </span>
                                  )}
                                </div>
                                {dataset.description && (
                                  <p className="text-[11px] text-slate-400 font-normal truncate max-w-xs mt-0.5">
                                    {dataset.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* File Type */}
                          <td className="py-4 px-6">
                            <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                              {formatDisplay}
                            </span>
                          </td>

                          {/* File Size */}
                          <td className="py-4 px-6 font-mono text-cyan-300 font-semibold whitespace-nowrap">
                            {formatBytes(dataset.sizeBytes || dataset.fileSize || 0)}
                          </td>

                          {/* Upload Date */}
                          <td className="py-4 px-6 text-slate-400 whitespace-nowrap">
                            <div className="flex items-center space-x-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span title={formattedDate}>{formattedDate}</span>
                            </div>
                            {relativeTime && (
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                {relativeTime}
                              </div>
                            )}
                          </td>

                          {/* Rows / Columns */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className="font-medium text-white">
                              {(dataset.rowCount || 0).toLocaleString()}
                            </span>{' '}
                            <span className="text-slate-500 text-[11px]">rows</span> •{' '}
                            <span className="font-medium text-white">
                              {dataset.columnCount || dataset.columns?.length || 0}
                            </span>{' '}
                            <span className="text-slate-500 text-[11px]">cols</span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>{dataset.status || 'Ready'}</span>
                            </span>
                          </td>

                          {/* Actions: Preview, Profile, Delete */}
                          <td className="py-4 px-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Preview Toggle Button */}
                              <button
                                type="button"
                                onClick={(e) => handleTogglePreview(dataset, e)}
                                className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isPreviewActive
                                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                                    : 'bg-cyan-950/80 text-cyan-300 hover:bg-cyan-900 border border-cyan-500/30'
                                }`}
                                title="Preview Dataset Records"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{isPreviewActive ? 'Close' : 'Preview'}</span>
                              </button>

                              {/* Details / Profile Link */}
                              <Link
                                to={`/dashboard/datasets/${dataset.id}`}
                                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#070b1c] text-cyan-300 hover:text-white hover:bg-cyan-950 border border-cyan-500/30 transition-all cursor-pointer"
                                title="Dataset Details & Schema Profiling"
                              >
                                <BarChart3 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Profile</span>
                              </Link>

                              {/* Dataset Deletion Button */}
                              <button
                                type="button"
                                onClick={(e) => handleDeleteDataset(dataset.id, dataset.name || dataset.fileName, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title={`Delete dataset "${dataset.name || dataset.fileName}"`}
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
            ) : (
              /* ========================================================= */
              /* LAYOUT 2: CARD LAYOUT (Filename, Type, Size, Upload Date, Actions) */
              /* ========================================================= */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredDatasets.map((dataset) => {
                  const isPreviewActive = previewingDatasetId === dataset.id;
                  const formattedDate = formatDate(dataset.uploadedAt || dataset.createdAt);
                  const relativeTime = formatRelativeTime(dataset.uploadedAt || dataset.createdAt);
                  const fileNameDisplay = dataset.fileName || dataset.name || 'Untitled';
                  const formatDisplay = (dataset.fileType || dataset.format || 'CSV').toUpperCase();

                  return (
                    <div
                      key={dataset.id}
                      onClick={(e) => handleTogglePreview(dataset, e)}
                      className={`bg-[#070b1c] rounded-3xl border transition-all duration-200 p-5 cursor-pointer relative flex flex-col justify-between group ${
                        isPreviewActive
                          ? 'border-cyan-400 ring-2 ring-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.3)] bg-[#0c1435]'
                          : 'border-slate-800 hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      }`}
                    >
                      <div>
                        {/* Card Header: Icon, Type Badge & Status */}
                        <div className="flex items-start justify-between mb-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <FileSpreadsheet className="w-5 h-5" />
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#050814] text-cyan-300 border border-slate-700 uppercase tracking-wider">
                              {formatDisplay}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                              {dataset.status || 'Ready'}
                            </span>
                          </div>
                        </div>

                        {/* Filename & Dataset Name */}
                        <h4
                          className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate"
                          title={fileNameDisplay}
                        >
                          {fileNameDisplay}
                        </h4>

                        {/* Description */}
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {dataset.description || 'Ingested dataset ready for schema inspection & ML preprocessing.'}
                        </p>

                        {/* Tags */}
                        {dataset.tags && dataset.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {dataset.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#050814] text-slate-300 border border-slate-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Metadata Strip: File Size, Upload Date, Rows & Columns */}
                      <div className="mt-5 pt-4 border-t border-slate-800 space-y-2.5 text-xs text-slate-400">
                        {/* Rows & Size */}
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">
                            {Number(dataset.rowCount || 0).toLocaleString()} rows • {dataset.columnCount || dataset.columns?.length || 0} cols
                          </span>
                          <span className="font-mono text-cyan-300 font-semibold flex items-center space-x-1">
                            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                            <span>{formatBytes(dataset.sizeBytes || dataset.fileSize || 0)}</span>
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

                        {/* Actions Footer */}
                        <div
                          className="pt-2 flex items-center justify-between border-t border-slate-800/60 gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center space-x-1.5">
                            {/* Preview Button */}
                            <button
                              type="button"
                              onClick={(e) => handleTogglePreview(dataset, e)}
                              className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isPreviewActive
                                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                                  : 'bg-cyan-950/80 text-cyan-300 hover:bg-cyan-900 border border-cyan-500/30'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isPreviewActive ? 'Close' : 'Preview'}</span>
                            </button>

                            {/* Profile Link */}
                            <Link
                              to={`/dashboard/datasets/${dataset.id}`}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#050814] text-cyan-300 hover:text-white hover:bg-cyan-950 border border-cyan-500/30 transition-all cursor-pointer"
                              title="Dataset Details & Profiling"
                            >
                              <BarChart3 className="w-3.5 h-3.5" />
                              <span>Profile</span>
                            </Link>
                          </div>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteDataset(dataset.id, dataset.name || dataset.fileName, e)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title={`Delete dataset "${dataset.name || dataset.fileName}"`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : datasets.length === 0 ? (
            /* Empty State: No Datasets Ingested */
            <div className="py-14 text-center">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-lg">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">No datasets uploaded yet</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Upload a real CSV, TSV, or JSON file to start analyzing data, previewing schemas, and configuring transformations.
                </p>
                <Link
                  to="/dashboard/datasets/upload"
                  className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Dataset</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Filter Empty State */
            <div className="py-10 text-center text-slate-400 text-xs">
              <p>No datasets match search query "{searchFilter}".</p>
              <button
                onClick={() => {
                  setSearchFilter('');
                  setSelectedFormat('ALL');
                }}
                className="mt-2 text-cyan-400 hover:underline font-bold cursor-pointer"
              >
                Clear search & format filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* INTERACTIVE DATASET PREVIEW UI (With Loading & Error States) */}
      {/* ========================================================= */}
      <div ref={previewSectionRef} className="pt-2">
        {previewingDatasetId && (
          <div className="space-y-3 animate-fade-in">
            <DatasetPreviewTable
              columns={previewData?.columns || []}
              rows={previewData?.rows || []}
              title={previewData?.fileName || previewData?.name || 'Dataset Preview'}
              format={previewData?.format || 'CSV'}
              totalRows={previewData?.totalRows}
              fileSizeBytes={previewData?.fileSizeBytes}
              isLoading={previewLoading}
              error={previewError}
              pagination={previewData?.pagination}
              onPageChange={handlePreviewPageChange}
              onPageSizeChange={handlePreviewSizeChange}
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

export default Dashboard;
