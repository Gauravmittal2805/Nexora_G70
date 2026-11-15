import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getFirstName } from '../../utils/userUtils';
import {
  Menu,
  Search,
  Bell,
  UploadCloud,
  ChevronRight,
  ShieldCheck,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Database,
  GitBranch,
  Cpu,
  BarChart3,
  Sparkles,
} from 'lucide-react';

const Header = ({ onOpenMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const getBreadcrumbTitle = (part) => {
    switch (part) {
      case 'dashboard':
        return 'Overview';
      case 'datasets':
        return 'Datasets';
      case 'upload':
        return 'Upload Dataset';
      case 'pipelines':
        return 'Pipelines';
      case 'features':
        return 'Feature Engineering';
      case 'models':
        return 'Model Studio';
      case 'analytics':
        return 'Analytics';
      case 'settings':
        return 'Settings';
      default:
        return part.charAt(0).toUpperCase() + part.slice(1);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#070b1c]/90 backdrop-blur-xl border-b border-cyan-500/15 px-4 sm:px-6 h-16 flex items-center justify-between">
      {/* Left: Mobile Menu Toggle & Quick Navigation Links */}
      <div className="flex items-center space-x-3 sm:space-x-6">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-1.5 text-xs sm:text-sm text-slate-400 font-medium">
          <Link
            to="/dashboard"
            className="text-white font-bold hover:text-cyan-400 transition-colors flex items-center space-x-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Nexora</span>
          </Link>
          {pathnames.map((segment, idx) => {
            const isLast = idx === pathnames.length - 1;
            const routeTo = `/${pathnames.slice(0, idx + 1).join('/')}`;

            return (
              <React.Fragment key={routeTo}>
                <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                {isLast ? (
                  <span className="text-cyan-300 font-semibold truncate max-w-[140px] sm:max-w-none">
                    {getBreadcrumbTitle(segment)}
                  </span>
                ) : (
                  <Link
                    to={routeTo}
                    className="hover:text-cyan-400 transition-colors truncate max-w-[100px] sm:max-w-none text-slate-400"
                  >
                    {getBreadcrumbTitle(segment)}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Quick Nav Pills (Desktop) */}
        <div className="hidden xl:flex items-center space-x-1 pl-4 border-l border-slate-800">
          <Link
            to="/dashboard/datasets"
            className="px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-cyan-300 hover:bg-white/5 rounded-lg transition-colors"
          >
            Datasets
          </Link>
          <Link
            to="/dashboard/pipelines"
            className="px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-cyan-300 hover:bg-white/5 rounded-lg transition-colors"
          >
            Pipelines
          </Link>
          <Link
            to="/dashboard/models"
            className="px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-cyan-300 hover:bg-white/5 rounded-lg transition-colors"
          >
            Models
          </Link>
          <Link
            to="/dashboard/analytics"
            className="px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-cyan-300 hover:bg-white/5 rounded-lg transition-colors"
          >
            Analytics
          </Link>
        </div>
      </div>

      {/* Middle: Quick Search (Desktop) */}
      <div className="hidden md:flex items-center relative w-64 lg:w-72">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search datasets, schema, models..."
          className="w-full bg-[#0a0f24] hover:bg-[#0e163b] focus:bg-[#0e163b] text-xs text-white placeholder-slate-500 pl-9 pr-12 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 transition-all font-medium"
        />
        <div className="absolute right-2.5 flex items-center pointer-events-none">
          <kbd className="text-[10px] bg-[#070b1c] border border-slate-700 px-1.5 py-0.5 rounded text-slate-400 font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Actions, Notifications & Profile Menu */}
      <div className="flex items-center space-x-2.5 sm:space-x-4">
        {/* Quick Upload CTA Button */}
        {location.pathname !== '/dashboard/datasets/upload' && (
          <button
            onClick={() => navigate('/dashboard/datasets/upload')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload Dataset</span>
          </button>
        )}

        {/* Notifications Icon with Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-slate-800 transition-colors cursor-pointer"
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#070b1c] animate-pulse" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0a0f24] rounded-2xl shadow-2xl border border-cyan-500/20 py-2 z-50 animate-fade-in backdrop-blur-xl">
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
                      Dataset Ready
                    </span>
                    <span className="text-[10px] text-slate-400">Just now</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Customer_Churn_Analysis.csv parsed successfully with 0 critical nulls.
                  </p>
                </div>

                <div className="p-3 hover:bg-white/5 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-white">
                      ML Ingestion Active
                    </span>
                    <span className="text-[10px] text-slate-400">1h ago</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Preprocessing pipelines initialized and ready for training.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu with First Name */}
        <div className="relative pl-2 border-l border-slate-800" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-2 p-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="User account menu"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              {getFirstName(user)[0]}
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-semibold text-white leading-tight">
                {getFirstName(user)}
              </div>
              <div className="text-[10px] text-cyan-400 font-medium flex items-center">
                <ShieldCheck className="w-3 h-3 mr-0.5 inline" /> Active Workspace
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#0a0f24] rounded-2xl shadow-2xl border border-cyan-500/20 py-2 z-50 animate-fade-in backdrop-blur-xl">
              <div className="px-4 py-2.5 border-b border-slate-800">
                <p className="text-xs font-bold text-white truncate">
                  {getFirstName(user)}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>

              <div className="py-1 text-xs text-slate-300">
                <Link
                  to="/"
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Nexora Home</span>
                </Link>
                <Link
                  to="/dashboard/datasets"
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span>Dataset Catalog</span>
                </Link>
                <Link
                  to="/dashboard/pipelines"
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <GitBranch className="w-3.5 h-3.5 text-purple-400" />
                  <span>ML Pipelines</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
