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
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState(() => datasetService.getDatasets());

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

  return (
    <div className="space-y-8 pb-16">
      {/* Top Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-8 sm:p-10 text-white shadow-xl">
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -top-12 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nexora ML Engine • Initial UI Active</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Developer'}!
            </h1>
            <p className="text-indigo-200 text-sm sm:text-base max-w-xl leading-relaxed">
              Your Nexora data platform is ready. Upload raw datasets, inspect inferred schemas, and initiate machine learning preprocessing pipelines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/dashboard/datasets/upload"
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-white text-indigo-950 font-bold text-xs shadow-lg hover:bg-indigo-50 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              <span>Upload New Dataset</span>
            </Link>
            <Link
              to="/dashboard/datasets"
              className="inline-flex items-center space-x-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-sm transition-all"
            >
              <Database className="w-4 h-4" />
              <span>Explore Catalog</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Datasets */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ingested Datasets
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
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
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Records Indexed
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {totalRecords.toLocaleString()}
          </div>
          <div className="flex items-center text-xs text-slate-500 mt-2 font-medium">
            <span>Across all tabular data sources</span>
          </div>
        </div>

        {/* Storage Size */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Storage Footprint
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {formatBytes(totalSizeBytes)}
          </div>
          <div className="flex items-center text-xs text-purple-600 mt-2 font-medium">
            <span>CSV & JSON parsed cached</span>
          </div>
        </div>

        {/* Pipeline Readiness */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              ML Workflow Phase
            </span>
            <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <GitBranch className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">Phase 01</div>
          <div className="flex items-center text-xs text-indigo-600 mt-2 font-medium">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            <span>Dataset Ingestion & Preview UI</span>
          </div>
        </div>
      </div>

      {/* Nexora Workflow Pipeline Progress Track */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Nexora Project Workflow</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              The continuous pipeline from raw dataset upload to trained ML inference models.
            </p>
          </div>
          <Link
            to="/dashboard/pipelines"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
          >
            <span>View Full Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Step Progression Bar */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            {
              step: '01',
              title: 'Dataset Ingestion',
              desc: 'Upload CSV, JSON, validate schema & nulls',
              status: 'Completed',
              highlight: true,
            },
            {
              step: '02',
              title: 'Data Preview & Table',
              desc: 'Type inference, pagination, sorting & filter',
              status: 'Completed',
              highlight: true,
            },
            {
              step: '03',
              title: 'Preprocessing & Cleaning',
              desc: 'Imputation, scaling, outliers & encoding',
              status: 'Next Up',
              highlight: false,
            },
            {
              step: '04',
              title: 'Model Studio',
              desc: 'Algorithm selection & training metrics',
              status: 'Upcoming',
              highlight: false,
            },
            {
              step: '05',
              title: 'Model Evaluation',
              desc: 'Confusion matrix, ROC-AUC & predictions',
              status: 'Upcoming',
              highlight: false,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                item.highlight
                  ? 'bg-indigo-50/50 border-indigo-200 shadow-2xs'
                  : 'bg-slate-50 border-slate-200/70'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-bold text-indigo-600">
                  Step {item.step}
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    item.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 leading-tight">{item.title}</div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Datasets Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Ingested Datasets</h3>
              <p className="text-xs text-slate-500">
                Click any dataset to inspect columns, preview records, or start a pipeline.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/dashboard/datasets/upload"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Dataset</span>
            </Link>
            <Link
              to="/dashboard/datasets"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-6">Dataset Name</th>
                <th className="py-3 px-6">Format</th>
                <th className="py-3 px-6">Records & Schema</th>
                <th className="py-3 px-6">File Size</th>
                <th className="py-3 px-6">Tags</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {datasets.slice(0, 5).map((ds) => (
                <tr
                  key={ds.id}
                  className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                  onClick={() => navigate('/dashboard/datasets')}
                >
                  <td className="py-3.5 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {ds.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {ds.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                      {ds.format || 'CSV'}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-medium text-slate-700">
                    {Number(ds.rowCount).toLocaleString()} rows • {ds.columnCount || ds.columns?.length || 0} cols
                  </td>
                  <td className="py-3.5 px-6 text-slate-500 font-mono">
                    {formatBytes(ds.sizeBytes || 0)}
                  </td>
                  <td className="py-3.5 px-6">
                    <div className="flex flex-wrap gap-1">
                      {(ds.tags || []).slice(0, 2).map((t, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {ds.status || 'Ready'}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/dashboard/datasets');
                      }}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      <span>Preview</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Drag & Drop Ingestion</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Upload CSV, JSON, and TSV files with automatic schema detection, delimiter identification, and instant previewing.
            </p>
          </div>
          <Link
            to="/dashboard/datasets/upload"
            className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
          >
            <span>Launch Uploader</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Schema Health Inspector</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Infers column data types (Integer, Float, Categorical, Boolean, Date) and flags missing or null values dynamically.
            </p>
          </div>
          <Link
            to="/dashboard/datasets"
            className="mt-4 text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center space-x-1"
          >
            <span>Browse Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mb-4">
              <GitBranch className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">ML Pipeline Integration</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Seamlessly pipe registered datasets into feature transformers, scikit-learn models, and evaluation dashboards.
            </p>
          </div>
          <Link
            to="/dashboard/pipelines"
            className="mt-4 text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center space-x-1"
          >
            <span>Explore ML Workflow</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
