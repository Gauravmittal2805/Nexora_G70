import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getFirstName } from '../../utils/userUtils';
import NexoraLogo from '../common/NexoraLogo';
import datasetService, { formatBytes } from '../../services/datasetService';
import {
  LayoutDashboard,
  Database,
  UploadCloud,
  Layers,
  Wand2,
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

  const [usedBytes, setUsedBytes] = useState(0);

  useEffect(() => {
    const calc = () => {
      const list = datasetService.getDatasets() || [];
      const total = list.reduce(
        (acc, d) => acc + (d.sizeBytes || d.fileSize || 0),
        0
      );
      setUsedBytes(total);
    };
    calc();
    window.addEventListener('storage', calc);
    const interval = setInterval(calc, 4000);
    return () => {
      window.removeEventListener('storage', calc);
      clearInterval(interval);
    };
  }, []);

  const MAX_STORAGE_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB
  const storagePercentage = Math.min(
    100,
    Math.max(usedBytes > 0 ? 1 : 0, Math.round((usedBytes / MAX_STORAGE_BYTES) * 100))
  );

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
          badgeColor: 'bg-cyan-950 text-cyan-300 border border-cyan-500/40',
        },
        {
          name: 'Field Mapping',
          path: '/dashboard/datasets/mapping',
          icon: Layers,
          badge: null,
        },
        {
          name: 'Transformations',
          path: '/dashboard/datasets/transform',
          icon: Wand2,
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
    <div className="flex flex-col h-full bg-[#070b1c] text-slate-300 border-r border-cyan-500/15 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 h-20 border-b border-cyan-500/15 shrink-0">
        <NavLink
          to="/dashboard"
          className="flex items-center overflow-hidden group"
          onClick={closeMobile}
        >
          <NexoraLogo
            size="md"
            showText={!isCollapsed}
            badgeText={!isCollapsed ? 'AI PLATFORM' : ''}
          />
        </NavLink>

        {/* Desktop collapse toggle */}
        <button
          onClick={toggleCollapse}
          className="hidden md:flex p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile close button */}
        <button
          onClick={closeMobile}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Link Items - Spacious & Uncompressed */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-7 scrollbar-thin scrollbar-thumb-slate-800">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1.5">
            {!isCollapsed ? (
              <div className="px-3.5 pb-1 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
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
                  className={`flex items-center px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_18px_rgba(6,182,212,0.35)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'
                    }`}
                  />
                  {!isCollapsed && (
                    <div className="flex items-center justify-between w-full ml-3.5 overflow-hidden">
                      <span className="truncate text-sm font-semibold tracking-wide">{item.name}</span>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
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

      {/* Storage Status Widget */}
      {!isCollapsed && (
        <div className="p-4 mx-4 mb-4 rounded-2xl bg-[#0a0f24] border border-cyan-500/20 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>Storage Usage</span>
            <span className="text-cyan-300 font-bold">
              {formatBytes(usedBytes)} / 10 GB
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${storagePercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5">
            <span>Workspace: Active</span>
            <span className="text-cyan-400 font-semibold flex items-center">
              <span className="w-2 h-2 rounded-full bg-cyan-400 mr-1.5 animate-pulse" />
              Operational
            </span>
          </div>
        </div>
      )}

      {/* User Footer Profile & Logout with First Name */}
      <div className="p-4 border-t border-slate-800 shrink-0">
        <div
          className={`flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          } p-2.5 rounded-2xl bg-[#0a0f24] border border-slate-800 hover:border-cyan-500/30 transition-colors`}
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-xs">
              {getFirstName(user)[0]}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold text-white truncate">
                  {getFirstName(user)}
                </span>
                <span className="text-xs text-slate-400 truncate">{user?.email}</span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={closeMobile}
          />
          <div className="relative w-80 max-w-[85vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
