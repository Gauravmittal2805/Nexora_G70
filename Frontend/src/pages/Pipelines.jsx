import React from 'react';
import {
  GitBranch,
  UploadCloud,
  Layers,
  Cpu,
  BarChart3,
  Sparkles,
  Play,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import datasetService from '../services/datasetService';

const workflowSteps = [
  {
    step: 1,
    title: 'Data Ingestion',
    subtitle: 'Upload CSV, JSON, XLSX datasets',
    status: 'Operational',
    icon: UploadCloud,
    color: 'from-cyan-500 to-blue-600',
    details: 'Dropzone validation, schema inference, null detection, preview tables.',
    active: true,
  },
  {
    step: 2,
    title: 'Data Cleaning & Preprocessing',
    subtitle: 'Missing values, duplicates & outliers',
    status: 'In Pipeline',
    icon: Layers,
    color: 'from-blue-600 to-indigo-600',
    details: 'Mean/median imputation, row filtering, category normalization.',
    active: true,
  },
  {
    step: 3,
    title: 'Feature Engineering',
    subtitle: 'Encoders, scalers & transformations',
    status: 'Upcoming',
    icon: GitBranch,
    color: 'from-indigo-600 to-purple-600',
    details: 'One-hot encoding, StandardScalar, MinMax normalization, PCA.',
    active: false,
  },
  {
    step: 4,
    title: 'Model Training Studio',
    subtitle: 'Classification, Regression & Tuning',
    status: 'Upcoming',
    icon: Cpu,
    color: 'from-purple-600 to-pink-600',
    details: 'LightGBM, XGBoost, Random Forest, Logistic Regression with hyperparameter tuning.',
    active: false,
  },
  {
    step: 5,
    title: 'Evaluation & Deployment',
    subtitle: 'Metrics, ROC curves & REST APIs',
    status: 'Upcoming',
    icon: BarChart3,
    color: 'from-pink-600 to-rose-600',
    details: 'Confusion matrices, precision/recall analysis, real-time inference endpoints.',
    active: false,
  },
];

const Pipelines = () => {
  return (
    <div className="space-y-8 pb-16 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            ML Workflow & Pipeline Studio
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Nexora end-to-end machine learning engineering workflow from raw dataset ingestion to serving.
          </p>
        </div>

        <Link
          to="/dashboard/datasets/upload"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Dataset</span>
        </Link>
      </div>

      {/* Visual Pipeline Flow */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
        {workflowSteps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className={`rounded-3xl border p-5 flex flex-col justify-between transition-all bg-[#0a0f24] ${
                s.active
                  ? 'border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/20'
                  : 'border-slate-800 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${s.color} text-white flex items-center justify-center font-bold text-sm shadow-md`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      s.active
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                  Phase 0{s.step}
                </div>
                <h3 className="text-sm font-bold text-white leading-tight mb-1">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {s.subtitle}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 leading-snug">
                {s.details}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Active Pipeline Status */}
      {(() => {
        const activeDataset = datasetService.getDatasets()[0] || null;
        return (
          <div className="bg-[#0a0f24] rounded-3xl border border-cyan-500/20 p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    Current Stage:{' '}
                    {activeDataset ? 'Dataset Ingestion Active' : 'Awaiting Ingestion'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mt-2">
                  {activeDataset
                    ? `${activeDataset.name || activeDataset.fileName} Pipeline`
                    : 'Automated ML Baseline Pipeline Studio'}
                </h3>
                <p className="text-xs text-slate-400 max-w-xl">
                  {activeDataset ? (
                    <>
                      Dataset loaded with{' '}
                      <span className="font-semibold text-white font-mono">
                        {activeDataset.rowCount || activeDataset.metadata?.rowCount || 0} rows
                      </span>
                      . Ready for statistical cleaning and feature scaling.
                    </>
                  ) : (
                    'No datasets currently uploaded. Upload your tabular CSV, TSV, or JSON file to configure transformations and training stages.'
                  )}
                </p>
              </div>

              <Link
                to="/dashboard/datasets/upload"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.35)]"
              >
                <Play className="w-3.5 h-3.5 text-white" />
                <span>{activeDataset ? 'Ingest More Data' : 'Upload First Dataset'}</span>
              </Link>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Pipelines;
