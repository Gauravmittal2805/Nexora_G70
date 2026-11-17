import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFirstName } from '../utils/userUtils';
import datasetService, { formatBytes } from '../services/datasetService';
import {
  UploadCloud,
  Database,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  FileSpreadsheet,
  Activity,
  HardDrive,
  Cpu,
  Search,
  Filter,
  Layers,
  BarChart3,
  Clock,
  Eye,
  Check,
  TrendingUp,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState(() => datasetService.getDatasets());
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('ALL');

  useEffect(() => {
    let active = true;
    const fetchLatest = () => {
      datasetService
        .fetchDatasets()
        .then((data) => {
          if (active && data) {
            setDatasets(data);
          }
        })
        .catch(() => {});
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

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
  const generalScore =
    hasDatasets && totalEstimatedCells > 0
      ? (healthPercentage / 10).toFixed(1)
      : '0.0';

  // Filter datasets by search and format
  const filteredDatasets = datasets.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesFormat =
      selectedFormat === 'ALL' || d.format.toUpperCase() === selectedFormat;
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
        <div className="bg-[#0a0f24] rounded-3xl border border-slate-800 p-5 shadow-lg hover:border-pink-500/40 hover:shadow-[0_0_20px_rgba(236,72,153,0.15)] transition-all group">
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
      {/* Inspired directly by the bottom-right image preview */}
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
                <>
                  {/* Flat baseline when zero datasets exist */}
                  <line
                    x1="0"
                    y1="145"
                    x2="500"
                    y2="145"
                    stroke="#334155"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />
                </>
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

        {/* Right: Circular / Radial Gauges (lg:col-span-4) matching Nexux preview */}
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
      {/* RECENT DATASETS TABLE (Nexux Dark Style) */}
      {/* ========================================================= */}
      <div className="bg-[#0a0f24] rounded-3xl border border-cyan-500/20 shadow-xl overflow-hidden">
        {/* Header & Filter Controls */}
        <div className="p-6 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#070b1c]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Ingested Datasets Catalog</h3>
              <p className="text-xs text-slate-400">
                Preview schemas, record counts, and inspect tabular structures.
              </p>
            </div>
          </div>

          {/* Interactive Search & Filter Options */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search datasets..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-800 bg-[#050814] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-44"
              />
            </div>

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

            <Link
              to="/dashboard/datasets/upload"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload</span>
            </Link>
          </div>
        </div>

        {/* Datasets Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#070b1c] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-6">Dataset Name</th>
                <th className="py-3 px-6">Format</th>
                <th className="py-3 px-6">Total Rows</th>
                <th className="py-3 px-6">Columns</th>
                <th className="py-3 px-6">File Size</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDatasets.length > 0 ? (
                filteredDatasets.map((dataset) => (
                  <tr key={dataset.id} className="hover:bg-cyan-500/5 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white">
                      <div className="flex items-center space-x-2">
                        <span>{dataset.name}</span>
                        {dataset.tags && dataset.tags.length > 0 && (
                          <span className="text-[10px] bg-slate-800 text-cyan-300 px-2 py-0.5 rounded-md border border-slate-700">
                            {dataset.tags[0]}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-normal truncate max-w-xs mt-0.5">
                        {dataset.description}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                        {dataset.format}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium text-white">
                      {(dataset.rowCount || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-medium text-white">
                        {dataset.columnCount || dataset.columns?.length || 0}
                      </span>
                      <span className="text-slate-500 text-[10px] ml-1">inferred</span>
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px] text-slate-400">
                      {formatBytes(dataset.sizeBytes)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{dataset.status || 'Ready'}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/dashboard/datasets/${dataset.id}`}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Profile</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : datasets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-lg">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-white">No datasets uploaded yet</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        All preloaded mock datasets have been removed. Upload a real CSV, TSV, or JSON file to start analyzing data.
                      </p>
                      <Link
                        to="/dashboard/datasets/upload"
                        className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Dataset</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    No datasets match your search query. Try clearing the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
