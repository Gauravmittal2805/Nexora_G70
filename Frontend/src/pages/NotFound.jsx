import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6 shadow-sm">
        <Sparkles className="w-8 h-8" />
      </div>
      <h1 className="text-6xl font-black text-slate-900 tracking-tight mb-2">404</h1>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Page Not Found</h2>
      <p className="text-slate-500 max-w-md text-sm mb-8 leading-relaxed">
        The page you are looking for might have been moved or doesn't exist. Check the URL or return to home.
      </p>
      <div className="flex items-center space-x-3">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-sm"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-sm transition-all"
        >
          <span>Go to Login</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
