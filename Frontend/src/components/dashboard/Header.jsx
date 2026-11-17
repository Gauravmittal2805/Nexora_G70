import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getFirstName } from '../../utils/userUtils';
import NexoraLogo from '../common/NexoraLogo';
import {
  Menu,
  Bell,
  UploadCloud,
  ChevronRight,
  ShieldCheck,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Database,
  BarChart3,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

const Header = ({ onOpenMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Generate breadcrumb parts
  const pathnames = location.pathname.split('/').filter((x) => x);
  const currentSegment = pathnames[pathnames.length - 1] || 'dashboard';

  const getPageTitle = (part) => {
    if (
      location.pathname.startsWith('/dashboard/datasets/') &&
      part !== 'datasets' &&
      part !== 'upload' &&
      part !== 'mapping'
    ) {
      return 'Dataset Details & Profiling';
    }
    switch (part) {
      case 'dashboard':
        return 'Dashboard Overview';
      case 'datasets':
        return 'Datasets Catalog';
      case 'upload':
        return 'Upload Dataset';
      case 'mapping':
        return 'Field Mapping Studio';
      case 'analytics':
        return 'Analytics & Telemetry';
      case 'settings':
        return 'Project Settings';
      default:
        return part.charAt(0).toUpperCase() + part.slice(1);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#070b1c]/95 backdrop-blur-2xl border-b border-cyan-500/15 px-6 sm:px-8 lg:px-10 h-20 flex items-center justify-between gap-6 transition-all">
      {/* Left: Mobile Menu Button & Clean Page Breadcrumb Header */}
      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-slate-800 transition-colors shrink-0 cursor-pointer"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Back to Landing Page Icon Button (Icon only) */}
        <Link
          to="/"
          className="p-2.5 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center justify-center shrink-0 shadow-xs group"
          title="Back to Landing Page"
          aria-label="Back to Landing Page"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        </Link>

        <div className="min-w-0">
          {/* Breadcrumb Hierarchy */}
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400">
            <Link
              to="/dashboard"
              className="hover:text-cyan-400 transition-colors"
            >
              Workspace
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
            <span className="text-cyan-400 font-bold truncate">
              {getPageTitle(currentSegment)}
            </span>
          </div>

          {/* Prominent Page Title */}
          <h1 className="text-base sm:text-lg font-black text-white tracking-tight leading-none mt-1 truncate">
            {getPageTitle(currentSegment)}
          </h1>
        </div>
      </div>

      {/* Right: Actions, Notifications & Profile Menu (Generously Spaced) */}
      <div className="flex items-center space-x-4 sm:space-x-5 lg:space-x-6 shrink-0">
        {/* Quick Upload CTA Button */}
        {location.pathname !== '/dashboard/datasets/upload' && (
          <button
            onClick={() => navigate('/dashboard/datasets/upload')}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Upload Dataset</span>
          </button>
        )}

        {/* Notifications Icon with Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="w-11 h-11 rounded-2xl text-slate-300 hover:text-white bg-[#0a0f24] hover:bg-white/5 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center justify-center cursor-pointer relative"
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-[#070b1c] animate-pulse" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-[#0a0f24] rounded-2xl shadow-2xl border border-cyan-500/20 py-2.5 z-50 animate-fade-in backdrop-blur-xl">
              <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white">System Feed</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-semibold px-2 py-0.5 rounded-full">
                  Live
                </span>
              </div>
              <div className="divide-y divide-slate-800 max-h-60 overflow-y-auto">
                <div className="p-3 hover:bg-white/5 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-white">
                      Workspace Ready
                    </span>
                    <span className="text-[10px] text-slate-400">Just now</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Tabular stream ingestor online. Ready for CSV, JSON, and TSV uploads.
                  </p>
                </div>

                <div className="p-3 hover:bg-white/5 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-white">
                      Data Engine Active
                    </span>
                    <span className="text-[10px] text-slate-400">1h ago</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Schema inference engine initialized and ready for preprocessing.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu with First Name */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-3 px-3.5 py-2 rounded-2xl bg-[#0a0f24] hover:bg-[#0e163b] border border-slate-800 hover:border-cyan-500/30 transition-all cursor-pointer shadow-xs"
            aria-label="User account menu"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-xs shrink-0">
              {getFirstName(user)[0]}
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-sm font-bold text-white leading-tight">
                {getFirstName(user)}
              </div>
              <div className="text-[11px] text-cyan-400 font-medium flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 inline text-cyan-400" /> Active Workspace
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-[#0a0f24] rounded-2xl shadow-2xl border border-cyan-500/20 py-2 z-50 animate-fade-in backdrop-blur-xl">
              <div className="px-4 py-2.5 border-b border-slate-800">
                <p className="text-sm font-bold text-white truncate">
                  {getFirstName(user)}
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
              </div>

              <div className="py-1 text-xs text-slate-300">
                <Link
                  to="/"
                  className="flex items-center space-x-2.5 px-4 py-2 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <NexoraLogo size="xs" showText={false} />
                  <span>Nexora Home</span>
                </Link>
                <Link
                  to="/dashboard/datasets"
                  className="flex items-center space-x-2.5 px-4 py-2 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span>Dataset Catalog</span>
                </Link>
                <Link
                  to="/dashboard/datasets/upload"
                  className="flex items-center space-x-2.5 px-4 py-2 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Upload Dataset</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
