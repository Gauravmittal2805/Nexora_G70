import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import datasetService, { formatBytes } from '../services/datasetService';
import DatasetPreviewTable from '../components/datasets/DatasetPreviewTable';
import {
  ArrowLeft,
  Database,
  Layers,
  FileSpreadsheet,
  HardDrive,
  Activity,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Download,
  Calendar,
  Tag,
  Hash,
  Type,
  PieChart,
  BarChart3,
  Sliders,
  Check,
  ChevronRight,
  TrendingUp,
  FileText,
  Clock,
  ShieldCheck,
} from 'lucide-react';

const TYPE_BADGES = {
  Integer: 'bg-blue-950/80 text-blue-300 border-blue-500/40',
  Float: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
  number: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
  String: 'bg-slate-800 text-slate-300 border-slate-700',
  string: 'bg-slate-800 text-slate-300 border-slate-700',
  Categorical: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
  Boolean: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
  boolean: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
  DateTime: 'bg-pink-950/80 text-pink-300 border-pink-500/40',
  date: 'bg-pink-950/80 text-pink-300 border-pink-500/40',
};

const DatasetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // View tabs
  const [activeTab, setActiveTab] = useState('columns'); // 'columns' | 'preview' | 'summary'

  // Column search & type filters
  const [columnSearch, setColumnSearch] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');

  // Load dataset profile from API
  const loadProfile = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const result = await datasetService.getDatasetProfile(id);
      if (result && result.profile) {
        setProfileData(result.profile);
      } else {
        throw new Error('Unable to retrieve dataset profiling statistics.');
      }
    } catch (err) {
      console.error('Failed to load dataset profile:', err);
      setError(err.message || 'Dataset could not be loaded. Please check the dataset ID.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Filter columns based on search and type
  const filteredColumns = useMemo(() => {
    if (!profileData?.columns) return [];
    return profileData.columns.filter((col) => {
      const matchesSearch = col.name.toLowerCase().includes(columnSearch.toLowerCase());
      if (selectedTypeFilter === 'ALL') return matchesSearch;

      const typeLower = String(col.dataType).toLowerCase();
      if (selectedTypeFilter === 'NUMERIC') {
        return matchesSearch && (typeLower.includes('int') || typeLower.includes('float') || typeLower === 'number');
      }
      if (selectedTypeFilter === 'TEXT') {
        return matchesSearch && (typeLower.includes('string') || typeLower.includes('text'));
      }
      if (selectedTypeFilter === 'CATEGORICAL') {
        return matchesSearch && typeLower.includes('cat');
      }
      if (selectedTypeFilter === 'BOOLEAN') {
        return matchesSearch && typeLower.includes('bool');
      }
      if (selectedTypeFilter === 'DATE') {
        return matchesSearch && (typeLower.includes('date') || typeLower.includes('time'));
      }
      return matchesSearch;
    });
  }, [profileData, columnSearch, selectedTypeFilter]);

  // Download client dataset as JSON/CSV
  const handleDownload = () => {
    if (!profileData) return;
    const content = JSON.stringify(profileData.previewRows || [], null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profileData.name || 'dataset'}_export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="space-y-8 pb-16 text-slate-100 animate-fade-in">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-800 rounded-md" />
            <div className="h-8 w-64 bg-slate-800 rounded-xl" />
            <div className="h-4 w-96 bg-slate-800 rounded-md" />
          </div>
          <div className="flex space-x-2">
            <div className="h-10 w-28 bg-slate-800 rounded-full" />
            <div className="h-10 w-28 bg-slate-800 rounded-full" />
          </div>
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#0a0f24] rounded-3xl border border-slate-800 p-5 space-y-3 animate-pulse">
              <div className="h-3 w-24 bg-slate-800 rounded" />
              <div className="h-8 w-32 bg-slate-800 rounded" />
              <div className="h-3 w-40 bg-slate-800 rounded" />
            </div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="bg-[#0a0f24] rounded-3xl border border-slate-800 p-8 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-cyan-400 mx-auto animate-spin" />
          <h3 className="text-base font-bold text-white">Profiling Dataset & Ingesting Schema...</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Computing column distributions, detecting data types, and calculating null frequencies.
          </p>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error || !profileData) {
    return (
      <div className="space-y-8 pb-16 text-slate-100 animate-fade-in">
        <Link
          to="/dashboard/datasets"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Datasets Catalog</span>
        </Link>

        <div className="bg-[#0a0f24] rounded-3xl border border-rose-500/30 p-10 text-center max-w-xl mx-auto shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Dataset Profiling Failed</h2>
          <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
            {error || 'Unable to find or profile this dataset. The file may have been removed or the ID is invalid.'}
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => loadProfile()}
              className="px-5 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Retry Profiling
            </button>
            <Link
              to="/dashboard/datasets"
              className="px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
            >
              Return to Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const {
    name,
    fileName,
    format,
    fileSizeBytes,
    rowCount,
    columnCount,
    totalCells,
    totalMissingCells,
    completenessScore,
    columnsWithMissing,
    cleanColumnsCount,
    typeCounts = {},
    createdAt,
    tags = [],
    columns = [],
    previewRows = [],
  } = profileData;

  return (
    <div className="space-y-8 pb-16 text-slate-100 animate-fade-in">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-1.5">
            <Link
              to="/dashboard/datasets"
              className="hover:text-cyan-400 flex items-center space-x-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Datasets Catalog</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-cyan-400 font-bold truncate max-w-xs">{name}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{name}</h1>
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              {format}
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Ready & Profiled</span>
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-2">
            <span>Original file: <strong className="text-slate-300 font-mono">{fileName}</strong></span>
            <span>•</span>
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1 text-slate-500" />
              {new Date(createdAt).toLocaleDateString([], {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => loadProfile(true)}
            disabled={isRefreshing}
            className="p-2.5 rounded-2xl bg-[#0a0f24] hover:bg-[#0f173b] border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Refresh Profiling Statistics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={handleDownload}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-[#0a0f24] hover:bg-[#0f173b] text-slate-200 hover:text-white text-xs font-semibold border border-cyan-500/25 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>

          <Link
            to={`/dashboard/datasets/mapping?datasetId=${profileData.datasetId}`}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Field Mapping Studio</span>
          </Link>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4 TOP KPI SUMMARY CARDS */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Records */}
        <div className="bg-[#0a0f24] rounded-3xl border border-slate-800 p-5 shadow-lg hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Records Indexed
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {rowCount.toLocaleString()}
          </div>
          <div className="flex items-center text-xs text-cyan-400 mt-2 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <span>Tabular Rows Available</span>
          </div>
        </div>

        {/* Total Columns */}
        <div className="bg-[#0a0f24] rounded-3xl border border-slate-800 p-5 shadow-lg hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Columns Inferred
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{columnCount}</div>
          <div className="flex items-center text-xs text-slate-400 mt-2 font-medium">
            <span>{cleanColumnsCount} clean columns • {columnsWithMissing} with nulls</span>
          </div>
        </div>

        {/* Storage Footprint */}
        <div className="bg-[#0a0f24] rounded-3xl border border-slate-800 p-5 shadow-lg hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              File Size & Storage
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {formatBytes(fileSizeBytes)}
          </div>
          <div className="flex items-center text-xs text-purple-400 mt-2 font-medium">
            <span>High-speed cached memory</span>
          </div>
        </div>

        {/* Data Completeness */}
        <div className="bg-[#0a0f24] rounded-3xl border border-slate-800 p-5 shadow-lg hover:border-pink-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Data Completeness
            </span>
            <div className="w-9 h-9 rounded-xl bg-pink-950/80 border border-pink-500/30 text-pink-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{completenessScore}%</div>
          <div className="flex items-center text-xs text-pink-400 mt-2 font-medium">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>
              {totalMissingCells === 0 ? 'Zero missing values' : `${totalMissingCells.toLocaleString()} missing cells`}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DATASET SUMMARY & METADATA SECTION */}
      {/* ========================================================= */}
      <div className="bg-[#0a0f24] rounded-3xl border border-cyan-500/20 p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dataset Summary & Schema Breakdown</h3>
              <p className="text-xs text-slate-400">
                High-level profiling overview, detected data types, and null metrics.
              </p>
            </div>
          </div>

          {/* Type Distribution Summary Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {typeCounts.numeric > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-blue-950/70 text-blue-300 border border-blue-500/30 font-semibold flex items-center space-x-1">
                <span>{typeCounts.numeric} Numeric</span>
              </span>
            )}
            {typeCounts.text > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-slate-300 border border-slate-700 font-semibold flex items-center space-x-1">
                <span>{typeCounts.text} Text</span>
              </span>
            )}
            {typeCounts.categorical > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-purple-950/70 text-purple-300 border border-purple-500/30 font-semibold flex items-center space-x-1">
                <span>{typeCounts.categorical} Categorical</span>
              </span>
            )}
            {typeCounts.boolean > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center space-x-1">
                <span>{typeCounts.boolean} Boolean</span>
              </span>
            )}
            {typeCounts.datetime > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-pink-950/70 text-pink-300 border border-pink-500/30 font-semibold flex items-center space-x-1">
                <span>{typeCounts.datetime} DateTime</span>
              </span>
            )}
          </div>
        </div>

        {/* 3-Column Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Metadata & File Info */}
          <div className="p-4 rounded-2xl bg-[#070b1c] border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              File Details
            </span>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">File Format:</span>
              <span className="font-mono font-bold text-cyan-300">{format}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Storage Size:</span>
              <span className="font-mono font-bold text-white">{formatBytes(fileSizeBytes)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Total Cells:</span>
              <span className="font-mono font-bold text-white">{totalCells.toLocaleString()}</span>
            </div>
          </div>

          {/* Quality & Null Summary */}
          <div className="p-4 rounded-2xl bg-[#070b1c] border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Quality & Completeness
            </span>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Completeness:</span>
              <span className="font-bold text-emerald-400">{completenessScore}%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Missing Cells:</span>
              <span className={`font-mono font-bold ${totalMissingCells > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {totalMissingCells.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Clean Columns:</span>
              <span className="font-mono font-bold text-cyan-300">
                {cleanColumnsCount} of {columnCount}
              </span>
            </div>
          </div>

          {/* Tags & Schema Status */}
          <div className="p-4 rounded-2xl bg-[#070b1c] border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Schema Governance
            </span>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Type Inference:</span>
              <span className="font-bold text-emerald-400 flex items-center">
                <Check className="w-3 h-3 mr-1" /> 100% Inferred
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-cyan-300">Ready for Mapping</span>
            </div>
            <div className="flex items-center space-x-1 pt-1">
              {tags.map((t, idx) => (
                <span
                  key={idx}
                  className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded-md border border-slate-800"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TABS: COLUMN PROFILING VS DATA RECORDS PREVIEW */}
      {/* ========================================================= */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('columns')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'columns'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.35)]'
              : 'text-slate-400 hover:text-white hover:bg-[#0a0f24]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Column Profiling & Types ({columnCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'preview'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.35)]'
              : 'text-slate-400 hover:text-white hover:bg-[#0a0f24]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Tabular Records Preview ({previewRows.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: COLUMN PROFILING TABLE & DETAILED NULL METRICS */}
      {/* ========================================================= */}
      {activeTab === 'columns' && (
        <div className="bg-[#0a0f24] rounded-3xl border border-cyan-500/20 shadow-xl overflow-hidden space-y-4 p-6">
          {/* Column Search & Filter Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Detected Columns & Type Profiling</h3>
              <p className="text-xs text-slate-400">
                Inspect inferred data types, null frequencies, and sample values per column.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={columnSearch}
                  onChange={(e) => setColumnSearch(e.target.value)}
                  placeholder="Filter column name..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-800 bg-[#070b1c] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-44"
                />
              </div>

              {/* Type Category Pills */}
              <div className="flex items-center space-x-1 bg-[#070b1c] p-1 rounded-xl text-xs font-semibold border border-slate-800">
                {['ALL', 'NUMERIC', 'TEXT', 'CATEGORICAL', 'BOOLEAN'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedTypeFilter(type)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      selectedTypeFilter === type
                        ? 'bg-cyan-600 text-white shadow-xs font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Column Details Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#070b1c] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-6">Column Name</th>
                  <th className="py-3 px-6">Detected Data Type</th>
                  <th className="py-3 px-6">Missing / Null Count</th>
                  <th className="py-3 px-6">Completeness Ratio</th>
                  <th className="py-3 px-6">Distinct Values</th>
                  <th className="py-3 px-6">Sample Values Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredColumns.length > 0 ? (
                  filteredColumns.map((col, idx) => {
                    const badgeClass =
                      TYPE_BADGES[col.dataType] || 'bg-slate-800 text-slate-300 border-slate-700';
                    const hasNulls = (col.nullCount || 0) > 0;
                    const nullPct = col.missingPercentage || 0;
                    const validPct = Math.max(0, 100 - nullPct);

                    return (
                      <tr key={col.name || idx} className="hover:bg-cyan-500/5 transition-colors">
                        {/* Index */}
                        <td className="py-4 px-4 font-mono text-[11px] text-slate-500">
                          {idx + 1}
                        </td>

                        {/* Column Name */}
                        <td className="py-4 px-6 font-bold text-white">
                          <div className="flex items-center space-x-2">
                            <span>{col.name}</span>
                          </div>
                        </td>

                        {/* Detected Data Type */}
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border font-mono ${badgeClass}`}
                          >
                            {col.dataType}
                          </span>
                        </td>

                        {/* Missing / Null Count */}
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`font-mono text-xs font-bold ${
                                hasNulls ? 'text-amber-400' : 'text-emerald-400'
                              }`}
                            >
                              {(col.nullCount || 0).toLocaleString()}
                            </span>
                            <span className="text-[11px] text-slate-500 font-normal">
                              ({nullPct}%)
                            </span>
                          </div>
                          <span
                            className={`inline-block mt-0.5 text-[10px] font-semibold ${
                              hasNulls ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {hasNulls ? '⚠ Needs Cleaning' : '✓ 100% Complete'}
                          </span>
                        </td>

                        {/* Completeness Progress Bar */}
                        <td className="py-4 px-6">
                          <div className="w-28 space-y-1">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>{validPct}%</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${
                                  hasNulls ? 'bg-amber-400' : 'bg-emerald-400'
                                }`}
                                style={{ width: `${validPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Distinct Count */}
                        <td className="py-4 px-6 font-mono text-xs text-slate-300">
                          {col.distinctCount ? `${col.distinctCount} unique` : '—'}
                        </td>

                        {/* Sample Values Chips */}
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(col.sampleValues || []).slice(0, 3).map((val, vIdx) => (
                              <span
                                key={vIdx}
                                className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-[#070b1c] text-slate-300 border border-slate-800 truncate max-w-[90px]"
                                title={String(val)}
                              >
                                {String(val)}
                              </span>
                            ))}
                            {(col.sampleValues || []).length > 3 && (
                              <span className="text-[10px] text-slate-500 self-center">
                                +{(col.sampleValues || []).length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500 text-xs">
                      No columns match the filter "{columnSearch}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: TABULAR RECORDS PREVIEW */}
      {/* ========================================================= */}
      {activeTab === 'preview' && (
        <DatasetPreviewTable
          columns={columns}
          rows={previewRows}
          title={`${name} — Raw Tabular Records`}
          format={format}
          totalRows={rowCount}
          fileSizeBytes={fileSizeBytes}
          showActions={true}
          onOpenMapping={() =>
            navigate(`/dashboard/datasets/mapping?datasetId=${profileData.datasetId}`)
          }
        />
      )}
    </div>
  );
};

export default DatasetDetails;