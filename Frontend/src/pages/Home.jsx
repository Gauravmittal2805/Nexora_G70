import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Layers,
  Code2,
  CheckCircle,
  LayoutDashboard,
  Cpu,
  Database,
  UploadCloud,
  GitBranch,
  Activity,
  CheckCircle2,
} from 'lucide-react';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeInteractiveTab, setActiveInteractiveTab] = useState('ingestion');

  return (
    <div className="relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-100/60 via-purple-50/40 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-20 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-20 w-80 h-80 bg-pink-200/25 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold mb-6 animate-fade-in shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>
            {isAuthenticated
              ? `Workspace Active • Logged in as ${user?.name || user?.email}`
              : 'Nexora Architecture • React 19 + Tailwind CSS + Vite'}
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          Empowering Next-Generation{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            Enterprise Apps
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {isAuthenticated
            ? 'Your fullstack data ingestion and ML preprocessing workspace is ready. Launch the dashboard, upload new tabular datasets, or inspect schemas in real time.'
            : 'Robust, modern authentication UI and scalable frontend architecture configured with React Router, Axios API services, and responsive Tailwind layouts.'}
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/25 transition-all text-sm group cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/dashboard/datasets/upload"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 shadow-xs transition-all text-sm cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                <span>Upload Dataset</span>
              </Link>
              <Link
                to="/dashboard/pipelines"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-semibold transition-all text-sm cursor-pointer"
              >
                <GitBranch className="w-4 h-4 text-purple-600" />
                <span>ML Pipelines</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/25 transition-all text-sm group cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 shadow-xs transition-all text-sm cursor-pointer"
              >
                <span>Sign In</span>
              </Link>
            </>
          )}
        </div>

        {/* Interactive Showcase Tabs */}
        <div className="mt-14 max-w-4xl mx-auto bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Interactive Architecture Explorer
              </h3>
              <p className="text-xs text-slate-500">
                Explore the modular layers configured in Nexora.
              </p>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'ingestion', label: 'Ingestion Engine', icon: Database },
                { id: 'auth', label: 'Auth & JWT', icon: Shield },
                { id: 'pipelines', label: 'ML Pipelines', icon: Cpu },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeInteractiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveInteractiveTab(tab.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeInteractiveTab === 'ingestion' && (
              <>
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase">Stream parser</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1 mb-1">CSV & JSON Streams</h4>
                  <p className="text-xs text-slate-600">High-speed chunked parsing supporting datasets up to 50MB.</p>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase">Automated</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1 mb-1">Type Inference</h4>
                  <p className="text-xs text-slate-600">Infers floats, integers, strings, booleans, and categories automatically.</p>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase">Integrity</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1 mb-1">Null Detection</h4>
                  <p className="text-xs text-slate-600">Counts missing records per column to prepare preprocessing imputation.</p>
                </div>
              </>
            )}

            {activeInteractiveTab === 'auth' && (
              <>
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                  <span className="text-[10px] font-bold text-purple-600 uppercase">Security</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1 mb-1">Dual Storage JWT</h4>
                  <p className="text-xs text-slate-600">SessionStorage for tab privacy or LocalStorage for remember me.</p>
                </div>
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                  <span className="text-[10px] font-bold text-purple-600 uppercase">Validation</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1 mb-1">Live Regex Checks</h4>
                  <p className="text-xs text-slate-600">Instant feedback on name, email format, and password complexity.</p>
                </div>
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                  <span className="text-[10px] font-bold text-purple-600 uppercase">Architecture</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1 mb-1">Protected Routes</h4>
                  <p className="text-xs text-slate-600">Route guard checking token validity and auto-redirecting to login.</p>
                </div>
              </>
            )}

            {activeInteractiveTab === 'pipelines' && (
              <>
                <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100">
                  <span className="text-[10px] font-bold text-pink-600 uppercase">Phase 01</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1 mb-1">Ingestion Complete</h4>
                  <p className="text-xs text-slate-600">Raw tabular datasets uploaded and cataloged in memory.</p>
                </div>
                <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100">
                  <span className="text-[10px] font-bold text-pink-600 uppercase">Phase 02</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1 mb-1">Preprocessing Studio</h4>
                  <p className="text-xs text-slate-600">Mean/median imputation and duplicate row filter transformations.</p>
                </div>
                <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100">
                  <span className="text-[10px] font-bold text-pink-600 uppercase">Phase 03</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1 mb-1">Model Studio</h4>
                  <p className="text-xs text-slate-600">Model training studio with classification baseline evaluation.</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tech Stack Strip */}
        <div className="mt-14 pt-8 border-t border-slate-200/80 max-w-4xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">
            Configured Tech Stack
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-xs hover:border-indigo-300 transition-colors">
              <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                <Cpu className="w-4 h-4" />
                <span className="font-bold text-sm text-slate-900">React 19 & Vite</span>
              </div>
              <p className="text-xs text-slate-500">Ultra-fast bundling & latest component ecosystem.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-xs hover:border-purple-300 transition-colors">
              <div className="flex items-center space-x-2 text-purple-600 mb-1">
                <Layers className="w-4 h-4" />
                <span className="font-bold text-sm text-slate-900">Tailwind CSS</span>
              </div>
              <p className="text-xs text-slate-500">Modern utility-first styling with high performance.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-xs hover:border-pink-300 transition-colors">
              <div className="flex items-center space-x-2 text-pink-600 mb-1">
                <Code2 className="w-4 h-4" />
                <span className="font-bold text-sm text-slate-900">React Router 7</span>
              </div>
              <p className="text-xs text-slate-500">Client-side declarative routing and protected routes.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-xs hover:border-emerald-300 transition-colors">
              <div className="flex items-center space-x-2 text-emerald-600 mb-1">
                <Zap className="w-4 h-4" />
                <span className="font-bold text-sm text-slate-900">Axios & Lucide</span>
              </div>
              <p className="text-xs text-slate-500">Intercepted HTTP requests & crisp modern iconography.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
