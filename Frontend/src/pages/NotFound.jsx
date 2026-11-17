import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import NexoraLogo from '../components/common/NexoraLogo';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-6">
        <NexoraLogo size="xl" showText={false} />
      </div>
      <h1 className="text-6xl font-black text-white tracking-tight mb-2">404</h1>
      <h2 className="text-xl font-bold text-cyan-400 mb-2">Page Not Found</h2>
      <p className="text-slate-400 max-w-md text-sm mb-8 leading-relaxed">
        The page you are looking for might have been moved or doesn't exist. Check the URL or return to home.
      </p>
      <div className="flex items-center space-x-3">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#0b1026] hover:bg-[#12193b] text-slate-300 hover:text-white border border-cyan-500/20 font-medium text-sm transition-all"
        >
          <span>Go to Login</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
