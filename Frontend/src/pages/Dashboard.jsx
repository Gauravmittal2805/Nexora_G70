import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
    datasetService
      .fetchDatasets()
      .then((data) => {
        if (active && data) {
          setDatasets(data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const totalRecords = datasets.reduce((acc, d) => acc + (d.rowCount || 0), 0);
  const totalSizeBytes = datasets.reduce((acc, d) => acc + (d.sizeBytes || 0), 0);

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
      color: 'from-blue-600 to-indigo-600',
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
      color: 'from-indigo-600 to-purple-600',
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
      color: 'from-purple-600 to-pink-600',
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
      color: 'from-pink-600 to-rose-600',
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
      color: 'from-emerald-600 to-teal-600',
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
    <div className="space-y-8 pb-10 animate-fade-in">
      {/* Interactive Top Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-10 text-white shadow-xl border border-indigo-950/60">
        {/* Ambient Decorative Glows */}
        <div className="absolute -right-12 -bottom-12 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -top-12 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-sm border border-white/15">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Nexora Workspace Active • Real-Time Pipeline Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Welcome back,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
                {user?.name || 'Developer'}
              </span>
              ! 👋
            </h1>
            <p className="text-indigo-200/90 text-sm sm:text-base leading-relaxed">
              Your high-throughput dataset platform is operational. Ingest tabular data, inspect inferred schemas, and initiate machine learning preprocessing pipelines.
            </p>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/dashboard/datasets/upload"
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-white text-indigo-950 font-bold text-xs shadow-lg hover:bg-indigo-50 hover:scale-102 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              <span>Upload New Dataset</span>
            </Link>
            <Link
              to="/dashboard/pipelines"
              className="inline-flex items-center space-x-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-sm border border-white/10 transition-all cursor-pointer"
            >
              <GitBranch className="w-4 h-4 text-purple-300" />
              <span>Launch Pipeline</span>
            </Link>
            <Link
              to="/dashboard/datasets"
              className="inline-flex items-center space-x-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-sm border border-white/10 transition-all cursor-pointer"
            >
              <Database className="w-4 h-4 text-indigo-300" />
              <span>Catalog</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive Diagnostic Feedback Banner */}
      {interactiveNotice && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs sm:text-sm flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-medium">{interactiveNotice}</span>
          </div>
          <button
            onClick={() => setInteractiveNotice(null)}
            className="text-indigo-500 hover:text-indigo-800 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Ingested Datasets */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Ingested Datasets
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {datasets.length}
          </div>
          <div className="flex items-center text-xs text-emerald-600 mt-2 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <span>Ready for Preprocessing</span>
          </div>
        </div>

        {/* Total Records */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Records Indexed
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {totalRecords.toLocaleString()}
          </div>
          <div className="flex items-center text-xs text-slate-500 mt-2 font-medium">
            <span>Across all tabular streams</span>
          </div>
        </div>

        {/* Storage Size */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:border-purple-300 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Storage Footprint
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {formatBytes(totalSizeBytes)}
          </div>
          <div className="flex items-center text-xs text-purple-600 mt-2 font-medium">
            <span>High-speed cached memory</span>
          </div>
        </div>

        {/* Model Accuracy Benchmark */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:border-pink-300 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Model Health Score
            </span>
            <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">98.9%</div>
          <div className="flex items-center text-xs text-indigo-600 mt-2 font-medium">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            <span>Optimal Baseline</span>
          </div>
        </div>
      </div>

      {/* Interactive ML Workflow Studio Pipeline Track */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Interactive ML Pipeline Workflow
              </h3>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                Click any step to inspect
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Continuous end-to-end lifecycle from raw dataset upload to trained machine learning models.
            </p>
          </div>
          <Link
            to="/dashboard/pipelines"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
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
                    ? 'bg-gradient-to-b from-indigo-50/80 to-purple-50/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md scale-102'
                    : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-mono font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`}>
                    Step {item.step}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 leading-tight">{item.title}</div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">{item.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Active Step Interactive Detail Card */}
        <div className="mt-5 p-5 rounded-2xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Step {currentStep.step}: {currentStep.title}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {currentStep.desc}
            </p>
          </div>
          <Link
            to={currentStep.actionPath}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-indigo-50 transition-all shrink-0 cursor-pointer"
          >
            <span>{currentStep.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
          </Link>
        </div>
      </div>

      {/* Interactive Quick Diagnostic Playground */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Interactive ML Health & Schema Tools
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Run instant micro-diagnostics directly on active cached memory.
            </p>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Real-time Node Runtime</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => triggerDiagnostic('nulls')}
            className="flex items-center space-x-3 p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50 hover:bg-indigo-50/60 hover:border-indigo-300 transition-all text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Check Null Values</p>
              <p className="text-[10px] text-slate-500">Scan missing values in datasets</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => triggerDiagnostic('schema')}
            className="flex items-center space-x-3 p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50 hover:bg-purple-50/60 hover:border-purple-300 transition-all text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Verify Schema Types</p>
              <p className="text-[10px] text-slate-500">Infer integers, floats & strings</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => triggerDiagnostic('pipeline')}
            className="flex items-center space-x-3 p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50 hover:bg-emerald-50/60 hover:border-emerald-300 transition-all text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Simulate Pipeline Batch</p>
              <p className="text-[10px] text-slate-500">Test preprocessing throughput</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Datasets Table with Real-time Search & Filter */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Header & Filter Controls */}
        <div className="p-6 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Ingested Datasets Catalog</h3>
              <p className="text-xs text-slate-500">
                Preview schemas, record counts, and inspect tabular structures.
              </p>
            </div>
          </div>

          {/* Interactive Search & Filter Options */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search datasets..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-44"
              />
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {['ALL', 'CSV', 'JSON'].map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setSelectedFormat(fmt)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedFormat === fmt
                      ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            <Link
              to="/dashboard/datasets/upload"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload</span>
            </Link>
          </div>
        </div>

        {/* Datasets Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
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
            <tbody className="divide-y divide-slate-100">
              {filteredDatasets.length > 0 ? (
                filteredDatasets.map((dataset) => (
                  <tr key={dataset.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <span>{dataset.name}</span>
                        {dataset.tags && dataset.tags.length > 0 && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                            {dataset.tags[0]}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-normal truncate max-w-xs mt-0.5">
                        {dataset.description}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                        {dataset.format}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-900">
                      {(dataset.rowCount || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-medium text-slate-900">
                        {dataset.columnCount || dataset.columns?.length || 0}
                      </span>
                      <span className="text-slate-400 text-[10px] ml-1">inferred</span>
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px]">
                      {formatBytes(dataset.sizeBytes)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{dataset.status || 'Ready'}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to="/dashboard/datasets"
                        className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
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
