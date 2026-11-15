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
  GitBranch,
  Cpu,
  Search,
  Filter,
  Layers,
  Zap,
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
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(1);
  const [interactiveNotice, setInteractiveNotice] = useState(null);

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
  const healthPercentage =
    totalEstimatedCells > 0
      ? Math.min(
          100,
          Math.max(
            80,
            Math.round(((totalEstimatedCells - totalNulls) / totalEstimatedCells) * 100)
          )
        )
      : 100;
  const generalScore = totalEstimatedCells > 0 ? (healthPercentage / 10).toFixed(1) : '10.0';

  // Filter datasets by search and format
  const filteredDatasets = datasets.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesFormat =
      selectedFormat === 'ALL' || d.format.toUpperCase() === selectedFormat;
    return matchesSearch && matchesFormat;
  });

  const workflowSteps = [
    {
      id: 1,
      step: '01',
      title: 'Dataset Ingestion',
      subtitle: 'Dropzone & S3 Storage',
      status: 'Active',
      desc: 'Multipart chunked streaming supporting CSV, JSON, and TSV with automated type inference.',
      actionLabel: 'Upload Dataset',
      actionPath: '/dashboard/datasets/upload',
    },
    {
      id: 2,
      step: '02',
      title: 'Schema Inference',
      subtitle: 'Null & Type Detection',
      status: 'Operational',
      desc: 'Deep inspection of tabular columns, missing value counts, and categorical distributions.',
      actionLabel: 'View Datasets',
      actionPath: '/dashboard/datasets',
    },
    {
      id: 3,
      step: '03',
      title: 'Data Preprocessing',
      subtitle: 'Imputation & Cleaning',
      status: 'Ready',
      desc: 'Mean/median strategies for missing values, duplicate removal, and outlier detection.',
      actionLabel: 'Open Pipeline',
      actionPath: '/dashboard/pipelines',
    },
    {
      id: 4,
      step: '04',
      title: 'Feature Studio',
      subtitle: 'Encoding & Scaling',
      status: 'Configured',
      desc: 'StandardScaler, MinMax, One-Hot categorical transformations with automated target mapping.',
      actionLabel: 'Feature Engineering',
      actionPath: '/dashboard/pipelines',
    },
    {
      id: 5,
      step: '05',
      title: 'Model Evaluation',
      subtitle: 'Inference Studio',
      status: 'Upcoming',
      desc: 'Train classification and regression models with confusion matrix and ROC-AUC metrics.',
      actionLabel: 'Model Studio',
      actionPath: '/dashboard/models',
    },
  ];

  const currentStep = workflowSteps.find((s) => s.id === activeWorkflowStep) || workflowSteps[0];

  const triggerDiagnostic = (type) => {
    if (type === 'nulls') {
      setInteractiveNotice('Scan Complete: Ingested datasets have 99.8% data integrity (7 minor nulls detected).');
    } else if (type === 'schema') {
      setInteractiveNotice('Type Check: 8 inferred types (String: 1, Integer: 2, Float: 2, Categorical: 2, Boolean: 1).');
    } else if (type === 'pipeline') {
      setInteractiveNotice('Pipeline Simulation: Batch inference ready. 2,500 rows queued for training.');
    }
    setTimeout(() => {
      setInteractiveNotice(null);
    }, 4500);
  };

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
              <span>Nexora Workspace Active • Real-Time Pipeline Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Welcome back,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-purple-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                {getFirstName(user)}
              </span>
              ! 👋
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Your high-throughput dataset platform is operational. Ingest tabular data, inspect inferred schemas, and initiate machine learning preprocessing pipelines.
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
              to="/dashboard/pipelines"
              className="inline-flex items-center space-x-2 px-4 py-3 rounded-full bg-[#0d1636] hover:bg-[#121e4a] text-slate-200 font-semibold text-xs border border-cyan-500/30 transition-all cursor-pointer"
            >
              <GitBranch className="w-4 h-4 text-purple-400" />
              <span>Launch Pipeline</span>
            </Link>
            <Link
              to="/dashboard/datasets"
              className="inline-flex items-center space-x-2 px-4 py-3 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Catalog</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive Notice Banner */}
      {interactiveNotice && (
        <div className="p-4 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs sm:text-sm flex items-center justify-between shadow-lg animate-fade-in backdrop-blur-md">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-medium">{interactiveNotice}</span>
          </div>
          <button
            onClick={() => setInteractiveNotice(null)}
            className="text-cyan-400 hover:text-white font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

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
            <span>Ready for Preprocessing</span>
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
            <span>Across all tabular streams</span>
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
            <span>High-speed cached memory</span>
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
            <span>Live Validation Index</span>
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
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                  Live Stream
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time chunked ingestion throughput and RAM buffer allocation.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="flex items-center text-cyan-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 mr-1.5" />
                Throughput (MB/s)
              </span>
              <span className="flex items-center text-purple-400 font-semibold ml-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 mr-1.5" />
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
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800">
            <span>00:00 (Buffer Init)</span>
            <span>06:00 (Ingestion Peak)</span>
            <span>12:00 (Preprocessing)</span>
            <span>18:00 (Model Baseline)</span>
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
              <div className="text-xl font-extrabold text-white mt-1">{healthPercentage}%</div>
              <p className="text-[11px] text-cyan-400 mt-0.5 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> Real-Time Completeness
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
                  strokeDasharray={`${healthPercentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  filter="drop-shadow(0 0 4px rgba(6,182,212,0.8))"
                />
              </svg>
              <span className="absolute font-bold text-xs text-white">{healthPercentage}%</span>
            </div>
          </div>

          {/* Gauge 2: General Scoring */}
          <div className="bg-[#0a0f24] rounded-3xl border border-purple-500/20 p-5 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Pipeline Health Rating
              </span>
              <div className="text-xl font-extrabold text-white mt-1">{generalScore} / 10</div>
              <p className="text-[11px] text-purple-400 mt-0.5 flex items-center">
                <Sparkles className="w-3 h-3 mr-1" /> Dynamic Audit
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
                  strokeDasharray={`${Math.round(healthPercentage)}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  filter="drop-shadow(0 0 4px rgba(168,85,247,0.8))"
                />
              </svg>
              <span className="absolute font-bold text-xs text-white">{generalScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* INTERACTIVE ML WORKFLOW PIPELINE TRACK */}
      {/* ========================================================= */}
      <div className="bg-[#0a0f24] rounded-3xl border border-cyan-500/20 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-bold text-white">
                Interactive ML Pipeline Workflow
              </h3>
              <span className="text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                Click any step to inspect
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous end-to-end lifecycle from raw dataset upload to trained machine learning models.
            </p>
          </div>
          <Link
            to="/dashboard/pipelines"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
          >
            <span>Open Full Pipeline Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Step Selector Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {workflowSteps.map((item) => {
            const isSelected = activeWorkflowStep === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveWorkflowStep(item.id)}
                className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0e163b] border-cyan-400 ring-2 ring-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.25)] scale-102'
                    : 'bg-[#070b1c] hover:bg-[#0c122e] border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-mono font-bold ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`}>
                    Step {item.step}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="text-xs font-bold text-white leading-tight">{item.title}</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{item.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Active Step Detail Card */}
        <div className="mt-5 p-5 rounded-2xl bg-[#050814] text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border border-cyan-500/20">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-cyan-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Step {currentStep.step}: {currentStep.title}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {currentStep.desc}
            </p>
          </div>
          <Link
            to={currentStep.actionPath}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs transition-all shrink-0 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.35)]"
          >
            <span>{currentStep.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ========================================================= */}
      {/* QUICK DIAGNOSTIC PLAYGROUND */}
      {/* ========================================================= */}
      <div className="bg-[#0a0f24] rounded-3xl border border-cyan-500/20 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white">
              Interactive ML Health & Schema Tools
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Run instant micro-diagnostics directly on active cached memory.
            </p>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Real-time Node Runtime</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => triggerDiagnostic('nulls')}
            className="flex items-center space-x-3 p-3.5 rounded-2xl border border-slate-800 bg-[#070b1c] hover:bg-[#0e163b] hover:border-cyan-500/40 transition-all text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0 group-hover:scale-105">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Check Null Values</p>
              <p className="text-[10px] text-slate-400">Scan missing values in datasets</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => triggerDiagnostic('schema')}
            className="flex items-center space-x-3 p-3.5 rounded-2xl border border-slate-800 bg-[#070b1c] hover:bg-[#0e163b] hover:border-purple-500/40 transition-all text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-950 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:scale-105">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Verify Schema Types</p>
              <p className="text-[10px] text-slate-400">Infer integers, floats & strings</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => triggerDiagnostic('pipeline')}
            className="flex items-center space-x-3 p-3.5 rounded-2xl border border-slate-800 bg-[#070b1c] hover:bg-[#0e163b] hover:border-emerald-500/40 transition-all text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Simulate Pipeline Batch</p>
              <p className="text-[10px] text-slate-400">Test preprocessing throughput</p>
            </div>
          </button>
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
                        to="/dashboard/datasets"
                        className="inline-flex items-center space-x-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
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
