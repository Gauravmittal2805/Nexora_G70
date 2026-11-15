import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  Search,
  Bell,
  UploadCloud,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

const Header = ({ onOpenMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Generate breadcrumb parts from pathname
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
      {/* Left: Mobile Menu Toggle & Breadcrumbs */}
      <div className="flex items-center space-x-3">
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
            className="text-slate-700 hover:text-indigo-600 transition-colors"
          >
            Nexora
          </Link>
          {pathnames.map((segment, idx) => {
            const isLast = idx === pathnames.length - 1;
            const routeTo = `/${pathnames.slice(0, idx + 1).join('/')}`;

            return (
              <React.Fragment key={routeTo}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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
      </div>

      {/* Middle: Quick Search (Desktop) */}
      <div className="hidden lg:flex items-center relative w-72">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          placeholder="Search datasets, models, metrics..."
          className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs pl-9 pr-12 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
        <div className="absolute right-2.5 flex items-center pointer-events-none">
          <kbd className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Quick Actions */}
      <div className="flex items-center space-x-2.5 sm:space-x-4">
        {/* Quick Upload CTA (if not on upload page) */}
        {location.pathname !== '/dashboard/datasets/upload' && (
          <button
            onClick={() => navigate('/dashboard/datasets/upload')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm hover:shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span className="hidden sm:inline">Upload Dataset</span>
          </button>
        )}

        {/* Notifications Icon */}
        <button
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
        </button>

        {/* User Mini Avatar Badge */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
            {user?.name ? user.name[0] : 'U'}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight">
              {user?.name || 'Developer'}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium flex items-center">
              <ShieldCheck className="w-3 h-3 mr-0.5 inline" /> Verified
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
