import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, ArrowLeft, Clock } from 'lucide-react';

const Analytics = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-fade-in">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-[#0a0f24] border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.25)]">
          <BarChart3 className="w-10 h-10" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
          <Clock className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span>Performance & Metrics</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
        Not implemented yet
      </h1>

      <p className="text-sm text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
        This feature is currently under active development. Performance analytics and metrics reporting will be available in an upcoming release.
      </p>

      <Link
        to="/dashboard"
        className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>
    </div>
  );
};

export default Analytics;