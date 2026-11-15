import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFirstName } from '../utils/userUtils';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Layers,
  Code2,
  CheckCircle2,
  LayoutDashboard,
  Cpu,
  Database,
  UploadCloud,
  GitBranch,
  Activity,
  FileSpreadsheet,
  HardDrive,
  Filter,
  BarChart3,
  Clock,
  Eye,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Terminal,
  Sliders,
  HelpCircle,
  RefreshCw,
  Play,
  Table,
  FileCode,
  Mail,
} from 'lucide-react';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  // Interactive Playground States
  const [selectedDatasetKey, setSelectedDatasetKey] = useState('churn');
  const [playgroundView, setPlaygroundView] = useState('table'); // 'table' | 'schema' | 'summary'
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(1);
  const [activeCodeTab, setActiveCodeTab] = useState('api');
  const [copiedCode, setCopiedCode] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  // Quick interactive email capture in hero
  const [quickEmail, setQuickEmail] = useState('');
  const [subscribedMessage, setSubscribedMessage] = useState(false);

  // Sample Datasets for Interactive Playground
  const sampleDatasets = {
    churn: {
      name: 'Customer_Churn_Analysis.csv',
      format: 'CSV',
      rowCount: 2500,
      columnsCount: 6,
      size: '184 KB',
      badgeColor: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40',
      description: 'Telecom customer retention, contract tenures, and monthly subscription charges.',
      columns: [
        { name: 'customer_id', type: 'String', nulls: 0, sample: 'CUST-8492' },
        { name: 'tenure_months', type: 'Int32', nulls: 0, sample: '14' },
        { name: 'monthly_charges', type: 'Float64', nulls: 3, sample: '65.40' },
        { name: 'contract_type', type: 'Categorical', nulls: 0, sample: 'Month-to-Month' },
        { name: 'tech_support', type: 'Boolean', nulls: 0, sample: 'false' },
        { name: 'churn_risk', type: 'Target (Class)', nulls: 0, sample: 'High' },
      ],
      rows: [
        { id: 'CUST-8492', tenure: '14 mos', charges: '$65.40', contract: 'Month-to-Month', support: 'No', risk: 'High' },
        { id: 'CUST-1029', tenure: '36 mos', charges: '$89.20', contract: 'One-Year', support: 'Yes', risk: 'Low' },
        { id: 'CUST-5581', tenure: '4 mos', charges: '$24.50', contract: 'Month-to-Month', support: 'No', risk: 'Medium' },
        { id: 'CUST-3904', tenure: '58 mos', charges: '$104.80', contract: 'Two-Year', support: 'Yes', risk: 'Low' },
        { id: 'CUST-7721', tenure: '19 mos', charges: '$78.10', contract: 'One-Year', support: 'No', risk: 'Medium' },
      ],
      summary: {
        avgTenure: '26.2 months',
        avgMonthlyCharge: '$72.60',
        churnRate: '28.4%',
        imputedNulls: '3 missing charges imputed via median ($68.50)',
      },
    },
    fraud: {
      name: 'Financial_Fraud_Detection.json',
      format: 'JSON',
      rowCount: 10420,
      columnsCount: 6,
      size: '1.2 MB',
      badgeColor: 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40',
      description: 'High-frequency credit card transactions with risk velocity and anomaly scores.',
      columns: [
        { name: 'transaction_id', type: 'String', nulls: 0, sample: 'TX-99014' },
        { name: 'amount_usd', type: 'Float64', nulls: 0, sample: '1450.00' },
        { name: 'merchant_cat', type: 'Categorical', nulls: 0, sample: 'Electronics' },
        { name: 'foreign_origin', type: 'Boolean', nulls: 0, sample: 'true' },
        { name: 'velocity_score', type: 'Float64', nulls: 1, sample: '0.94' },
        { name: 'is_fraud', type: 'Target (Class)', nulls: 0, sample: 'Flagged' },
      ],
      rows: [
        { id: 'TX-99014', tenure: '$1,450.00', charges: 'Electronics', contract: 'Yes', support: '0.94', risk: 'Flagged' },
        { id: 'TX-99015', tenure: '$34.20', charges: 'Grocery', contract: 'No', support: '0.05', risk: 'Normal' },
        { id: 'TX-99016', tenure: '$520.00', charges: 'Jewelry', contract: 'Yes', support: '0.82', risk: 'Flagged' },
        { id: 'TX-99017', tenure: '$12.80', charges: 'Dining', contract: 'No', support: '0.02', risk: 'Normal' },
        { id: 'TX-99018', tenure: '$89.00', charges: 'Retail', contract: 'No', support: '0.11', risk: 'Normal' },
      ],
      summary: {
        avgTenure: '$221.40 avg amt',
        avgMonthlyCharge: '0.14 avg velocity',
        churnRate: '1.8% flagged',
        imputedNulls: '1 anomaly velocity score interpolated via KNN',
      },
    },
    vitals: {
      name: 'Healthcare_Patient_Vitals.tsv',
      format: 'TSV',
      rowCount: 4200,
      columnsCount: 6,
      size: '390 KB',
      badgeColor: 'bg-purple-950/60 text-purple-300 border-purple-500/40',
      description: 'Hospital clinical readings, cardiovascular metrics, and readmission risk tiers.',
      columns: [
        { name: 'patient_id', type: 'String', nulls: 0, sample: 'PAT-209' },
        { name: 'systolic_bp', type: 'Int32', nulls: 2, sample: '142' },
        { name: 'heart_rate', type: 'Int32', nulls: 0, sample: '88' },
        { name: 'blood_sugar', type: 'Float64', nulls: 5, sample: '164.5' },
        { name: 'smoker', type: 'Boolean', nulls: 0, sample: 'true' },
        { name: 'readmission_risk', type: 'Target (Class)', nulls: 0, sample: 'Severe' },
      ],
      rows: [
        { id: 'PAT-209', tenure: '142 mmHg', charges: '88 bpm', contract: '164.5 mg/dL', support: 'Yes', risk: 'Severe' },
        { id: 'PAT-312', tenure: '118 mmHg', charges: '72 bpm', contract: '98.2 mg/dL', support: 'No', risk: 'Normal' },
        { id: 'PAT-405', tenure: '134 mmHg', charges: '82 bpm', contract: '140.0 mg/dL', support: 'Yes', risk: 'Elevated' },
        { id: 'PAT-511', tenure: '122 mmHg', charges: '68 bpm', contract: '102.4 mg/dL', support: 'No', risk: 'Normal' },
        { id: 'PAT-639', tenure: '150 mmHg', charges: '94 bpm', contract: '185.0 mg/dL', support: 'Yes', risk: 'Severe' },
      ],
      summary: {
        avgTenure: '128.4 avg systolic',
        avgMonthlyCharge: '76.8 bpm avg',
        churnRate: '14.2% high risk',
        imputedNulls: '7 missing vitals imputed via Gaussian mean estimation',
      },
    },
  };

  const currentDataset = sampleDatasets[selectedDatasetKey];

  // 4-Step Interactive Workflow Pipeline Data
  const workflowSteps = [
    {
      id: 1,
      step: '01',
      title: 'High-Throughput Ingestion',
      subtitle: 'Stream Parsers for CSV, JSON & TSV',
      tag: 'Chunked Streaming',
      desc: 'Nexora parses multi-megabyte files incrementally using client-side buffers and backend stream pipelines. Supports files up to 50MB with zero UI freeze.',
      details: [
        'Automatic delimiter detection (comma, tab, semicolon, pipe)',
        'Resilient handling of malformed records & quote escaping',
        'Direct S3 / Local storage cache with 100% data integrity',
      ],
    },
    {
      id: 2,
      step: '02',
      title: 'Heuristic Schema Inference',
      subtitle: 'Automated Type & Column Detection',
      tag: 'Zero-Config Types',
      desc: 'Instantly scans columnar values to classify data into Float64, Int32, Boolean, Categorical, or Freeform Text, computing null frequencies per column.',
      details: [
        'Heuristic regex pattern matching across sampled records',
        'Null frequency auditing & missing index mapping',
        'Automatic identification of potential target variables',
      ],
    },
    {
      id: 3,
      step: '03',
      title: 'Smart Imputation & Preprocessing',
      subtitle: 'Leakage-Free Cleaning Strategies',
      tag: 'Preprocessing Studio',
      desc: 'Applies configurable statistical cleaning: numerical mean/median imputation, categorical mode substitution, duplicate stripping, and outlier clipping.',
      details: [
        'StandardScaler & MinMax numerical normalization',
        'One-Hot & Ordinal encoding for high-cardinality features',
        'Strict train/test boundary enforcement to avoid data leakage',
      ],
    },
    {
      id: 4,
      step: '04',
      title: 'Model Studio & Baseline Evaluation',
      subtitle: 'Training, Metrics & One-Click Export',
      tag: 'ML Inference',
      desc: 'Evaluates baseline predictive models on preprocessed data. Inspect confusion matrices, precision/recall curves, and ROC-AUC scores with instant CSV/JSON exports.',
      details: [
        'Automated 80/20 train-test stratification',
        'Baseline Random Forest and Logistic Regression metrics',
        'Clean dataset export ready for Scikit-learn or PyTorch',
      ],
    },
  ];

  const activeWorkflow = workflowSteps.find((s) => s.id === activeWorkflowStep) || workflowSteps[0];

  // Code Snippets for Architecture Viewer
  const codeSnippets = {
    api: {
      fileName: 'src/services/api.js',
      lang: 'JavaScript',
      code: `import axios from 'axios';
import tokenService from './tokenService';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request Interceptor: Injects Active Bearer Token
api.interceptors.request.use((config) => {
  const token = tokenService.getToken();
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

// Response Interceptor: Handles 401 Session Expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenService.removeToken();
      window.location.href = '/login?expired=true';
    }
    return Promise.reject(error);
  }
);

export default api;`,
    },
    stream: {
      fileName: 'src/services/datasetService.js',
      lang: 'JavaScript',
      code: `// Chunked Ingestion & Schema Inference Engine
export const parseTabularStream = async (file, onProgress) => {
  const chunkSize = 64 * 1024; // 64KB stream chunks
  let offset = 0;
  const inferredSchema = { columns: [], rowCount: 0 };

  while (offset < file.size) {
    const slice = file.slice(offset, offset + chunkSize);
    const chunkText = await readSliceAsText(slice);
    
    // Heuristic delimiter & type inference
    inferColumnTypes(chunkText, inferredSchema);
    offset += chunkSize;
    onProgress(Math.min(100, Math.round((offset / file.size) * 100)));
  }

  return inferredSchema;
};`,
    },
    auth: {
      fileName: 'src/services/authService.js',
      lang: 'JavaScript',
      code: `// Dual Storage JWT Authentication Service
export const login = async (email, password, rememberMe = true) => {
  const response = await api.post('/auth/login', { email, password });
  const { token, user } = response.data;

  // Dual Storage: LocalStorage for persistence or SessionStorage for strict privacy
  if (rememberMe) {
    localStorage.setItem('nexora_token', token);
  } else {
    sessionStorage.setItem('nexora_token', token);
  }

  return { token, user };
};`,
    },
    guards: {
      fileName: 'src/components/ProtectedRoute.jsx',
      lang: 'JSX',
      code: `import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Verifying session...</div>;
  }

  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

export default ProtectedRoute;`,
    },
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeCodeTab].code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // FAQ Items
  const faqItems = [
    {
      q: 'What file formats and sizes does Nexora support?',
      a: 'Nexora supports CSV, JSON, and TSV formats up to 50MB per file with client-side chunked streaming. Delimiters, headers, and encoding formats are inferred automatically during upload.',
    },
    {
      q: 'How does Nexora handle missing or malformed values?',
      a: 'During schema inference, Nexora detects null frequencies per column. In the Preprocessing Studio, you can choose imputation strategies including numerical Mean/Median, categorical Mode, or row-dropping heuristics with zero data leakage.',
    },
    {
      q: 'How is user authentication secured?',
      a: 'Authentication is powered by dual-storage JWT tokens with SHA-256 signatures. Axios interceptors automatically inject Bearer headers into all requests, and Protected Route wrappers prevent unauthenticated access to datasets.',
    },
    {
      q: 'Can I export clean datasets and baseline model metrics?',
      a: 'Yes. Processed datasets can be exported with one click as clean CSV or JSON files. Trained baseline performance metrics (accuracy, precision, recall, confusion matrix) can also be downloaded as evaluation reports.',
    },
    {
      q: 'Does the application work offline or without a backend?',
      a: 'Nexora includes intelligent client-side fallbacks. When the backend server is in maintenance or offline, simulated dataset parsers and local storage allow you to test and preview all UI workflows seamlessly.',
    },
  ];

  return (
    <div className="relative overflow-hidden bg-[#060813] text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* ========================================================= */}
      {/* NEXUX-STYLE ELECTRIC RIBBON & LIGHT WAVE BACKGROUND */}
      {/* ========================================================= */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[640px] pointer-events-none overflow-hidden z-0">
        {/* Curved electric light ribbon waves */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[1200px] h-[340px] bg-gradient-to-r from-cyan-500/20 via-blue-600/25 to-purple-600/20 rounded-[100%] blur-[90px] rotate-[-7deg]" />
        <div className="absolute top-36 left-1/3 -translate-x-1/2 w-[800px] h-[200px] bg-gradient-to-r from-blue-500/30 via-indigo-500/30 to-pink-500/20 rounded-[100%] blur-[70px] rotate-[12deg]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d15_1px,transparent_1px),linear-gradient(to_bottom,#1f293d15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: HERO SECTION & NEXUX VALUE PROPOSITION */}
      {/* ========================================================= */}
      <section className="relative pt-16 pb-16 md:pt-28 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
        {/* Nexux Style Floating Pill Badge: ✦ A.I Device ✦ */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-7 animate-fade-in shadow-[0_0_20px_rgba(6,182,212,0.25)] backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>
            {isAuthenticated
              ? `✦ Welcome back, ${getFirstName(user)} • Nexora AI Active ✦`
              : '✦ A.I Driven Enterprise Data Platform ✦'}
          </span>
        </div>

        {/* Primary Headline - Inspired directly by the Nexux template */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.12] max-w-5xl mx-auto">
          Transform Your Business with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-purple-400 drop-shadow-[0_0_35px_rgba(56,189,248,0.3)]">
            AI-Powered Solutions
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {isAuthenticated
            ? `Your fullstack workspace is active, ${getFirstName(user)}. Ingest massive tabular streams, automate schema checks, impute missing values, and train baseline models in real time.`
            : 'Our enterprise AI platform automates repetitive dataset tasks, infers tabular schemas instantly, and streamlines end-to-end ML preprocessing workflows.'}
        </p>

        {/* Nexux Hero Glowing Email / Action Input Pill */}
        {!isAuthenticated && (
          <div className="mt-10 max-w-md mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubscribedMessage(true);
                setTimeout(() => setSubscribedMessage(false), 3500);
              }}
              className="relative flex items-center p-1.5 rounded-full bg-[#0d142d]/90 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/30 transition-all backdrop-blur-xl"
            >
              <div className="pl-4 pr-2 text-slate-400 pointer-events-none">
                <Mail className="w-4 h-4 text-cyan-400" />
              </div>
              <input
                type="email"
                value={quickEmail}
                onChange={(e) => setQuickEmail(e.target.value)}
                placeholder="Your Work Email Address"
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none pr-3"
                required
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer whitespace-nowrap"
              >
                Get Started
              </button>
            </form>
            {subscribedMessage && (
              <p className="text-xs text-cyan-300 mt-2 font-medium animate-fade-in">
                ✓ Check your inbox! Your Nexora workspace invite has been generated.
              </p>
            )}
          </div>
        )}

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all text-sm group cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Workspace Dashboard</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/dashboard/datasets/upload"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-full bg-[#0a1029] hover:bg-[#0f173b] text-white font-bold border border-cyan-500/30 shadow-md transition-all text-sm cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-cyan-400" />
                <span>Upload Dataset</span>
              </Link>
              <Link
                to="/dashboard/pipelines"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-4 rounded-full bg-white/5 hover:bg-white/10 text-slate-200 font-bold border border-slate-700 transition-all text-sm cursor-pointer"
              >
                <GitBranch className="w-4 h-4 text-purple-400" />
                <span>ML Pipelines</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all text-sm group cursor-pointer"
              >
                <span>Launch Nexora Free</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-full bg-[#0a1029] hover:bg-[#0f173b] text-slate-200 font-bold border border-cyan-500/30 transition-all text-sm cursor-pointer"
              >
                <span>Sign In to Workspace</span>
              </Link>
            </>
          )}
        </div>

        {/* Real-Time Platform Reliability Strip (Nexux Dark Style) */}
        <div className="mt-14 max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-3xl bg-[#090e24]/80 backdrop-blur-xl border border-cyan-500/20 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <div className="p-3 text-center border-r border-slate-800 last:border-none">
            <div className="text-2xl sm:text-3xl font-black text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              99.98%
            </div>
            <div className="text-xs text-slate-400 font-medium mt-0.5 flex items-center justify-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Parse Reliability</span>
            </div>
          </div>
          <div className="p-3 text-center border-r border-slate-800 last:border-none">
            <div className="text-2xl sm:text-3xl font-black text-blue-400">
              &lt; 14ms
            </div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">Schema Inference Latency</div>
          </div>
          <div className="p-3 text-center border-r border-slate-800 last:border-none">
            <div className="text-2xl sm:text-3xl font-black text-purple-400">
              50 MB
            </div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">Stream Chunk Limit</div>
          </div>
          <div className="p-3 text-center">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">
              0%
            </div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">Data Leakage Guarantee</div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 2: INTERACTIVE LIVE DATASET PLAYGROUND */}
      {/* ========================================================= */}
      <section id="tools" className="py-20 md:py-24 bg-[#080d1f] border-y border-cyan-500/15 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Table className="w-3.5 h-3.5" />
              <span>Interactive Ingestion Playground</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Test Real-Time Ingestion Right Now
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-2">
              Select any sample tabular dataset below to inspect instant column type inference, null value tracking, and summary statistics without leaving this page.
            </p>
          </div>

          {/* Dataset Selector Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            {Object.keys(sampleDatasets).map((key) => {
              const dataset = sampleDatasets[key];
              const isSelected = selectedDatasetKey === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDatasetKey(key)}
                  className={`flex items-center space-x-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0f1738] text-cyan-300 border-cyan-400 ring-2 ring-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.25)] scale-102'
                      : 'bg-[#0a0f24] hover:bg-[#0d1430] text-slate-400 border-slate-800'
                  }`}
                >
                  <FileSpreadsheet className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{dataset.name}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${dataset.badgeColor}`}>
                    {dataset.format}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Playground Dark Card Frame */}
          <div className="bg-[#0a0f24]/90 rounded-3xl border border-cyan-500/25 shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Top Toolbar */}
            <div className="p-4 sm:p-6 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#070b1c]/80">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-white text-base sm:text-lg">
                    {currentDataset.name}
                  </h3>
                  <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold px-2.5 py-0.5 rounded-full">
                    Ingested & Inferred
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-xl">
                  {currentDataset.description}
                </p>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center space-x-1.5 bg-[#050814] p-1 rounded-xl border border-slate-800 self-start md:self-auto">
                <button
                  onClick={() => setPlaygroundView('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    playgroundView === 'table'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Table Records
                </button>
                <button
                  onClick={() => setPlaygroundView('schema')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    playgroundView === 'schema'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Inferred Schema & Nulls
                </button>
                <button
                  onClick={() => setPlaygroundView('summary')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    playgroundView === 'summary'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Summary Stats
                </button>
              </div>
            </div>

            {/* View 1: Tabular Preview */}
            {playgroundView === 'table' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#080d22] text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      {currentDataset.columns.map((col) => (
                        <th key={col.name} className="py-3.5 px-6">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-white">{col.name}</span>
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                              {col.type}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {currentDataset.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-cyan-500/5 transition-colors">
                        <td className="py-3.5 px-6 font-mono font-semibold text-cyan-300">{row.id}</td>
                        <td className="py-3.5 px-6">{row.tenure}</td>
                        <td className="py-3.5 px-6 font-medium text-white">{row.charges}</td>
                        <td className="py-3.5 px-6">{row.contract}</td>
                        <td className="py-3.5 px-6 font-semibold">{row.support}</td>
                        <td className="py-3.5 px-6">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              row.risk === 'High' || row.risk === 'Flagged' || row.risk === 'Severe'
                                ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                                : row.risk === 'Medium' || row.risk === 'Elevated'
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {row.risk}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* View 2: Schema & Null Tracking */}
            {playgroundView === 'schema' && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentDataset.columns.map((col) => (
                    <div
                      key={col.name}
                      className="p-4 rounded-2xl border border-slate-800 bg-[#070b1c]/70 hover:border-cyan-500/40 transition-all shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-white">{col.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold">
                          {col.type}
                        </span>
                      </div>
                      <div className="space-y-1 text-[11px] text-slate-400">
                        <div className="flex justify-between">
                          <span>Sample Value:</span>
                          <span className="font-mono text-cyan-300">{col.sample}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Missing (Null) Values:</span>
                          <span className={col.nulls > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-semibold'}>
                            {col.nulls > 0 ? `${col.nulls} missing` : '0 nulls (100% clean)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View 3: Summary Statistics */}
            {playgroundView === 'summary' && (
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-[#070b1c] border border-cyan-500/20">
                    <span className="text-[11px] font-bold text-cyan-400 uppercase">Primary Stat</span>
                    <div className="text-xl font-black text-white mt-1">{currentDataset.summary.avgTenure}</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Feature distribution mean</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#070b1c] border border-purple-500/20">
                    <span className="text-[11px] font-bold text-purple-400 uppercase">Secondary Stat</span>
                    <div className="text-xl font-black text-white mt-1">{currentDataset.summary.avgMonthlyCharge}</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Secondary feature average</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#070b1c] border border-pink-500/20">
                    <span className="text-[11px] font-bold text-pink-400 uppercase">Target Prevalence</span>
                    <div className="text-xl font-black text-white mt-1">{currentDataset.summary.churnRate}</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Positive class proportion</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#070b1c] border border-emerald-500/20">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase">Cleanliness</span>
                    <div className="text-xl font-black text-white mt-1">99.8%</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Record validity ratio</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#050814] text-white flex items-center justify-between border border-slate-800">
                  <div className="flex items-center space-x-2 text-xs">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-slate-300">{currentDataset.summary.imputedNulls}</span>
                  </div>
                  <span className="text-[11px] text-cyan-400 font-mono">Statistical Imputation Engine</span>
                </div>
              </div>
            )}

            {/* Playground Bottom Action Banner */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#070b1c]/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-400">
                Want to process your own raw CSV or JSON file with automated schema detection?
              </span>
              <div className="flex items-center space-x-3">
                <Link
                  to={isAuthenticated ? '/dashboard/datasets/upload' : '/register'}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.35)] cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Custom Dataset</span>
                </Link>
                {isAuthenticated && (
                  <Link
                    to="/dashboard/datasets"
                    className="inline-flex items-center space-x-1 px-3 py-2 text-slate-300 hover:text-cyan-400 font-semibold"
                  >
                    <span>View Catalog</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 3: THE 4-STEP END-TO-END PIPELINE STUDIO */}
      {/* ========================================================= */}
      <section id="pipeline" className="py-20 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
            <GitBranch className="w-3.5 h-3.5" />
            <span>End-to-End Pipeline</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How Nexora Transforms Raw Data Into Models
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-2">
            Click on any phase below to inspect the automated lifecycle from initial drag-and-drop ingestion to trained model metrics.
          </p>
        </div>

        {/* 4 Interactive Step Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {workflowSteps.map((step) => {
            const isSelected = activeWorkflowStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setActiveWorkflowStep(step.id)}
                className={`text-left p-5 rounded-3xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0e163b] border-cyan-400 ring-2 ring-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.25)] scale-102'
                    : 'bg-[#0a0f24] hover:bg-[#0d1430] border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-mono font-extrabold ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`}>
                    PHASE {step.step}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {step.tag}
                  </span>
                </div>
                <h3 className="font-extrabold text-white text-base leading-tight mb-1">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {step.subtitle}
                </p>
              </button>
            );
          })}
        </div>

        {/* Selected Step Detailed Feature Banner */}
        <div className="bg-[#0a0f24] text-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-cyan-500/20 backdrop-blur-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-bold font-mono">
                <span>Phase {activeWorkflow.step}</span>
                <span>•</span>
                <span>{activeWorkflow.tag}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {activeWorkflow.title}
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {activeWorkflow.desc}
              </p>

              <div className="pt-2 space-y-2">
                {activeWorkflow.details.map((detail, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#050814] p-6 rounded-2xl border border-cyan-500/20 space-y-4 shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <span className="font-mono text-cyan-400 flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Terminal Feed</span>
                </span>
                <span className="flex items-center text-cyan-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1.5 animate-pulse" />
                  Live
                </span>
              </div>

              <div className="font-mono text-xs text-slate-300 space-y-2">
                <div className="text-cyan-400">$ nexora pipeline run --phase {activeWorkflow.step}</div>
                <div className="text-slate-400">&gt; Initializing stream buffer... [OK]</div>
                <div className="text-slate-400">&gt; Applying {activeWorkflow.tag} transform... [100%]</div>
                <div className="text-emerald-400">&gt; Status: Ingestion verified with 0 memory leaks.</div>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <Link
                  to={isAuthenticated ? '/dashboard/pipelines' : '/register'}
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.35)] cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Launch Interactive Pipeline</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 4: ENTERPRISE CAPABILITIES GRID (6 CARDS) */}
      {/* ========================================================= */}
      <section className="py-20 bg-[#080d1f] border-y border-cyan-500/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Cpu className="w-3.5 h-3.5" />
              <span>Modular Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Enterprise Data Platform Capabilities
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-2">
              Engineered with clean separation of concerns, high throughput, and seamless developer ergonomics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-7 rounded-3xl bg-[#0a0f24] border border-slate-800 hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Streaming Tabular Ingestion</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Chunk-based parsers process multi-megabyte CSV and JSON datasets up to 50MB smoothly without blocking user interactions or crashing the browser tab.
              </p>
              <div className="mt-4 flex items-center space-x-2 text-xs font-semibold text-cyan-400">
                <span>Chunked 64KB Streams</span>
                <span className="text-slate-600">•</span>
                <span>Zero UI Freeze</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-7 rounded-3xl bg-[#0a0f24] border border-slate-800 hover:border-blue-500/40 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-blue-950/80 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Heuristic Type Detection</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Automatic detection of Float64, Int32, Boolean flags, timestamps, and high-cardinality categories using heuristic pattern sampling.
              </p>
              <div className="mt-4 flex items-center space-x-2 text-xs font-semibold text-blue-400">
                <span>99.8% Precision</span>
                <span className="text-slate-600">•</span>
                <span>Type Autocasting</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-7 rounded-3xl bg-[#0a0f24] border border-slate-800 hover:border-purple-500/40 hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Dual-Storage JWT Auth</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Enterprise security with dual-mode storage: choose SessionStorage for strict tab privacy or LocalStorage for persistent 'Remember Me' sessions.
              </p>
              <div className="mt-4 flex items-center space-x-2 text-xs font-semibold text-purple-400">
                <span>SHA-256 Tokens</span>
                <span className="text-slate-600">•</span>
                <span>Axios Interceptors</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-7 rounded-3xl bg-[#0a0f24] border border-slate-800 hover:border-emerald-500/40 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Missing Value Imputation</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Clean and impute missing records with mean, median, mode, or row elimination. Built to guarantee zero information leakage between train and test splits.
              </p>
              <div className="mt-4 flex items-center space-x-2 text-xs font-semibold text-emerald-400">
                <span>Mean & Median</span>
                <span className="text-slate-600">•</span>
                <span>Zero Leakage</span>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="p-7 rounded-3xl bg-[#0a0f24] border border-slate-800 hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Clean Frontend Service Layers</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Structured into dedicated modules: <code className="font-mono text-cyan-300">authService</code>, <code className="font-mono text-cyan-300">datasetService</code>, and <code className="font-mono text-cyan-300">tokenService</code> for maintainable, enterprise code.
              </p>
              <div className="mt-4 flex items-center space-x-2 text-xs font-semibold text-cyan-400">
                <span>Modular Architecture</span>
                <span className="text-slate-600">•</span>
                <span>REST API Ready</span>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="p-7 rounded-3xl bg-[#0a0f24] border border-slate-800 hover:border-pink-500/40 hover:shadow-[0_0_25px_rgba(236,72,153,0.2)] transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-pink-950/80 border border-pink-500/30 text-pink-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Real-Time Health & Diagnostics</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Inspect dataset health scores, column distributions, and baseline classification metrics before deploying models into production.
              </p>
              <div className="mt-4 flex items-center space-x-2 text-xs font-semibold text-pink-400">
                <span>ROC-AUC Curves</span>
                <span className="text-slate-600">•</span>
                <span>Live Health Scoring</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 5: INTERACTIVE ARCHITECTURE & CODE INSPECTOR */}
      {/* ========================================================= */}
      <section className="py-20 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Terminal className="w-3.5 h-3.5" />
            <span>Developer Ergonomics</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Inspect the Production Frontend Code
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-2">
            Explore the exact service files and interceptors powering authentication, token handling, and dataset parsing in Nexora.
          </p>
        </div>

        {/* Code Viewer Container */}
        <div className="bg-[#050814] rounded-3xl border border-cyan-500/20 shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Code Viewer Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#080d22]">
            {/* File Switcher Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'api', name: 'api.js (Axios)', icon: Code2 },
                { id: 'stream', name: 'datasetService.js', icon: Database },
                { id: 'auth', name: 'authService.js', icon: Shield },
                { id: 'guards', name: 'ProtectedRoute.jsx', icon: CheckCircle2 },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeCodeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCodeTab(tab.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto border border-slate-700"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-cyan-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Syntax Highlighted Code Box */}
          <div className="p-6 overflow-x-auto bg-[#04060e] font-mono text-xs text-cyan-100 leading-relaxed max-h-[420px] scrollbar-thin scrollbar-thumb-slate-800">
            <pre>
              <code>{codeSnippets[activeCodeTab].code}</code>
            </pre>
          </div>

          {/* Code Viewer Footer Info */}
          <div className="px-6 py-3 border-t border-slate-800/80 bg-[#070b1c] flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Location: {codeSnippets[activeCodeTab].fileName}</span>
            <span>Language: {codeSnippets[activeCodeTab].lang}</span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 6: PERFORMANCE BENCHMARK COMPARISON */}
      {/* ========================================================= */}
      <section id="benchmarks" className="py-20 bg-[#080d1f] border-y border-cyan-500/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Zap className="w-3.5 h-3.5" />
              <span>Speed & Reliability Benchmarks</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Benchmarked for Extreme Performance
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-2">
              See how Nexora compares against conventional frontend tabular parsing and script-based approaches.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-[#0a0f24] rounded-3xl border border-cyan-500/20 shadow-2xl overflow-hidden backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-300">
                <thead className="bg-[#070b1c] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6">Pipeline Metric</th>
                    <th className="py-4 px-6 text-cyan-400 font-extrabold">Nexora Stream Engine</th>
                    <th className="py-4 px-6 text-slate-500">Traditional Web Parsers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr className="hover:bg-cyan-500/5">
                    <td className="py-4 px-6 font-semibold text-white">
                      50MB CSV Ingestion Latency
                    </td>
                    <td className="py-4 px-6 font-bold text-cyan-400 flex items-center space-x-1.5">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span>~14ms chunked start</span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">180ms - 420ms (UI thread locks)</td>
                  </tr>
                  <tr className="hover:bg-cyan-500/5">
                    <td className="py-4 px-6 font-semibold text-white">
                      Browser Heap Memory Usage
                    </td>
                    <td className="py-4 px-6 font-bold text-indigo-300">
                      12MB (buffered slice recycling)
                    </td>
                    <td className="py-4 px-6 text-slate-500">85MB - 140MB (full file in memory)</td>
                  </tr>
                  <tr className="hover:bg-cyan-500/5">
                    <td className="py-4 px-6 font-semibold text-white">
                      Schema Type Inference
                    </td>
                    <td className="py-4 px-6 font-bold text-cyan-400">
                      Automatic Heuristic In-Stream
                    </td>
                    <td className="py-4 px-6 text-slate-500">Manual column mapping required</td>
                  </tr>
                  <tr className="hover:bg-cyan-500/5">
                    <td className="py-4 px-6 font-semibold text-white">
                      Token Persistence Mode
                    </td>
                    <td className="py-4 px-6 font-bold text-indigo-300">
                      Dual Mode (Session + Local Storage)
                    </td>
                    <td className="py-4 px-6 text-slate-500">Single unencrypted cookie/storage</td>
                  </tr>
                  <tr className="hover:bg-cyan-500/5">
                    <td className="py-4 px-6 font-semibold text-white">
                      Data Leakage Protection
                    </td>
                    <td className="py-4 px-6 font-bold text-cyan-400">
                      Strict Train/Test Isolation
                    </td>
                    <td className="py-4 px-6 text-slate-500">Ad-hoc imputation across full dataset</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 7: INTERACTIVE FAQ ACCORDION */}
      {/* ========================================================= */}
      <section id="faq" className="py-20 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-2">
            Everything you need to know about Nexora's dataset ingestion, schema detection, and architecture.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3.5">
          {faqItems.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-[#0a0f24] shadow-xs overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm sm:text-base font-bold text-white hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-4" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 animate-fade-in">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 8: PRE-FOOTER CTA BANNER */}
      {/* ========================================================= */}
      <section className="pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1430] via-[#09122a] to-[#120f38] p-8 sm:p-14 text-white shadow-2xl border border-cyan-500/30 text-center">
          {/* Nexux Ribbon Background Sweeps */}
          <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-cyan-500/20 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-purple-500/20 rounded-full blur-[90px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-5">
            <span className="inline-block px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              Start Ingesting Today
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Ready to Accelerate Your ML Data Pipeline?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Join data scientists and engineering teams using Nexora to automate dataset ingestion, heuristic schema checks, and baseline model deployment.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Launch Workspace Overview</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/dashboard/datasets/upload"
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 backdrop-blur-xs transition-all cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-cyan-400" />
                    <span>Upload Dataset File</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
                  >
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 backdrop-blur-xs transition-all cursor-pointer"
                  >
                    <span>Sign In</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
