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

const workflowSteps = [
  {
    step: 1,
    title: 'Data Ingestion',
    subtitle: 'Upload CSV, JSON, XLSX datasets',
    status: 'Operational',
    icon: UploadCloud,
    color: 'from-blue-600 to-indigo-600',
    details: 'Dropzone validation, schema inference, null detection, preview tables.',
    active: true,
  },
  {
    step: 2,
    title: 'Data Cleaning & Preprocessing',
    subtitle: 'Missing values, duplicates & outliers',
    status: 'In Pipeline',
    icon: Layers,
    color: 'from-indigo-600 to-purple-600',
    details: 'Mean/median imputation, row filtering, category normalization.',
    active: true,
  },
  {
    step: 3,
    title: 'Feature Engineering',
    subtitle: 'Encoders, scalers & transformations',
    status: 'Upcoming',
    icon: GitBranch,
    color: 'from-purple-600 to-pink-600',
    details: 'One-hot encoding, StandardScalar, MinMax normalization, PCA.',
    active: false,
  },
  {
    step: 4,
    title: 'Model Training Studio',
    subtitle: 'Classification, Regression & Tuning',
    status: 'Upcoming',
    icon: Cpu,
    color: 'from-pink-600 to-rose-600',
    details: 'LightGBM, XGBoost, Random Forest, Logistic Regression with hyperparameter tuning.',
    active: false,
  },
  {
    step: 5,
    title: 'Evaluation & Deployment',
    subtitle: 'Metrics, ROC curves & REST APIs',
    status: 'Upcoming',
    icon: BarChart3,
    color: 'from-rose-600 to-amber-600',
    details: 'Confusion matrices, precision/recall analysis, real-time inference endpoints.',
    active: false,
  },
];

const Pipelines = () => {
  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ML Workflow & Pipeline Studio
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Nexora end-to-end machine learning engineering workflow from raw dataset ingestion to serving.
          </p>
        </div>

        <Link
          to="/dashboard/datasets/upload"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all self-start sm:self-auto"
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
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all bg-white ${
                s.active
                  ? 'border-indigo-200 shadow-md shadow-indigo-500/5 ring-1 ring-indigo-500/10'
                  : 'border-slate-200/80 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${s.color} text-white flex items-center justify-center font-bold text-sm shadow-sm`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      s.active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
                  Phase 0{s.step}
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight mb-1">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  {s.subtitle}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-snug">
                {s.details}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Active Pipeline Status */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Current Stage: Dataset Ingestion Active</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-2">
              Customer Churn ML Baseline Pipeline
            </h3>
            <p className="text-xs text-slate-500 max-w-xl">
              Target variable: <span className="font-mono font-semibold text-slate-800">Churn (Boolean)</span>.
              Ingested from <span className="font-semibold text-slate-800">Customer_Churn_Analysis.csv</span>.
            </p>
          </div>

          <Link
            to="/dashboard/datasets/upload"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-sm"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ingest More Data</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Pipelines;
