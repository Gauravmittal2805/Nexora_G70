import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 h-16 flex items-center justify-between">
      {/* Left: Mobile Menu Toggle & Quick Navigation Links */}
      <div className="flex items-center space-x-3 sm:space-x-6">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-1.5 text-xs sm:text-sm text-slate-500 font-medium">
          <Link
            to="/dashboard"
            className="text-slate-800 font-bold hover:text-indigo-600 transition-colors flex items-center space-x-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Nexora</span>
          </Link>
          {pathnames.map((segment, idx) => {
            const isLast = idx === pathnames.length - 1;
            const routeTo = `/${pathnames.slice(0, idx + 1).join('/')}`;

            return (
              <React.Fragment key={routeTo}>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                {isLast ? (
                  <span className="text-slate-900 font-semibold truncate max-w-[140px] sm:max-w-none">
                    {getBreadcrumbTitle(segment)}
                  </span>
                ) : (
                  <Link
                    to={routeTo}
                    className="hover:text-indigo-600 transition-colors truncate max-w-[100px] sm:max-w-none"
                  >
                    {getBreadcrumbTitle(segment)}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Quick Nav Pills (Desktop) */}
        <div className="hidden xl:flex items-center space-x-1 pl-4 border-l border-slate-200">
          <Link
            to="/dashboard/datasets"
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Datasets
          </Link>
          <Link
            to="/dashboard/pipelines"
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Pipelines
          </Link>
          <Link
            to="/dashboard/models"
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Models
          </Link>
          <Link
            to="/dashboard/analytics"
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Analytics
          </Link>
        </div>
      </div>

      {/* Middle: Quick Search (Desktop) */}
      <div className="hidden md:flex items-center relative w-64 lg:w-72">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search datasets, schema, models..."
          className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs pl-9 pr-12 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
        <div className="absolute right-2.5 flex items-center pointer-events-none">
          <kbd className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 font-mono">
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
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm hover:shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload Dataset</span>
          </button>
        )}

        {/* Notifications Icon with Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">System Notifications</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">
                  Live Feed
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                <div className="p-3 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-slate-900">
                      Dataset Ready
                    </span>
                    <span className="text-[10px] text-slate-400">Just now</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Customer_Churn_Analysis.csv parsed successfully with 0 critical nulls.
                  </p>
                </div>

                <div className="p-3 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-slate-900">
                      ML Ingestion Active
                    </span>
                    <span className="text-[10px] text-slate-400">1h ago</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Preprocessing pipelines initialized and ready for training.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative pl-2 border-l border-slate-200" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-2 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="User account menu"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.name || 'Developer'}
              </div>
              <div className="text-[10px] text-emerald-600 font-medium flex items-center">
                <ShieldCheck className="w-3 h-3 mr-0.5 inline" /> Active Workspace
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-fade-in">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.name || 'Developer'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>

              <div className="py-1 text-xs text-slate-700">
                <Link
                  to="/"
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-slate-50 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nexora Home</span>
                </Link>
                <Link
                  to="/dashboard/datasets"
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-slate-50 transition-colors"
                >
                  <Database className="w-3.5 h-3.5 text-slate-400" />
                  <span>Dataset Catalog</span>
                </Link>
                <Link
                  to="/dashboard/pipelines"
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-slate-50 transition-colors"
                >
                  <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                  <span>ML Pipelines</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
