import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Database,
  UploadCloud,
  GitBranch,
  Layers,
  Cpu,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  X,
} from 'lucide-react';

const Sidebar = ({ isCollapsed, toggleCollapse, mobileOpen, closeMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroups = [
    {
      group: 'DATA PLATFORM',
      items: [
        {
          name: 'Dashboard Overview',
          path: '/dashboard',
          icon: LayoutDashboard,
          badge: null,
        },
        {
          name: 'All Datasets',
          path: '/dashboard/datasets',
          icon: Database,
          badge: null,
        },
        {
          name: 'Upload Dataset',
          path: '/dashboard/datasets/upload',
          icon: UploadCloud,
          badge: 'New',
          badgeColor: 'bg-indigo-100 text-indigo-700',
        },
      ],
    },
    {
      group: 'ML WORKFLOW',
      items: [
        {
          name: 'Pipelines',
          path: '/dashboard/pipelines',
          icon: GitBranch,
          badge: 'Beta',
          badgeColor: 'bg-purple-100 text-purple-700',
        },
        {
          name: 'Feature Engineering',
          path: '/dashboard/features',
          icon: Layers,
          badge: null,
        },
        {
          name: 'Model Studio',
          path: '/dashboard/models',
          icon: Cpu,
          badge: null,
        },
      ],
    },
    {
      group: 'ANALYTICS & SYSTEM',
      items: [
        {
          name: 'Performance & Metrics',
          path: '/dashboard/analytics',
          icon: BarChart3,
          badge: null,
        },
        {
          name: 'Project Settings',
          path: '/dashboard/settings',
          icon: Settings,
          badge: null,
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800">
        <NavLink
          to="/dashboard"
          className="flex items-center space-x-3 overflow-hidden group"
          onClick={closeMobile}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white leading-none">
                Nexora
              </span>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase mt-1">
                Data Platform
              </span>
            </div>
          )}
        </NavLink>

        {/* Desktop collapse toggle */}
        <button
          onClick={toggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile close button */}
        <button
          onClick={closeMobile}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Link Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!isCollapsed ? (
              <div className="px-3 text-[11px] font-bold text-slate-500 tracking-wider">
                {group.group}
              </div>
            ) : (
              <div className="h-px bg-slate-800 my-2" />
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobile}
                  title={isCollapsed ? item.name : undefined}
                  className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                    }`}
                  />
                  {!isCollapsed && (
                    <div className="flex items-center justify-between w-full ml-3 overflow-hidden">
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                            isActive ? 'bg-white/20 text-white' : item.badgeColor
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Quick Storage Status / Widget */}
      {!isCollapsed && (
        <div className="p-3 mx-3 mb-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
            <span>Storage Usage</span>
            <span className="text-white font-semibold">1.4 GB / 10 GB</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full w-[14%]" />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>Workspace: Active</span>
            <span className="text-emerald-400 font-semibold flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
              Ready
            </span>
          </div>
        </div>
      )}

      {/* User Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-800">
        <div
          className={`flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          } p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 transition-colors`}
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user?.name ? user.name[0] : 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-white truncate">
                  {user?.name || 'Nexora User'}
                </span>
                <span className="text-[11px] text-slate-400 truncate">{user?.email}</span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block transition-all duration-300 ease-in-out shrink-0 sticky top-0 h-screen ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity"
            onClick={closeMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
