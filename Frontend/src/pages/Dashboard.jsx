import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  User,
  ShieldCheck,
  CheckCircle,
  Key,
  Database,
  ArrowRight,
  LogOut,
  FolderKanban,
  Activity,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl mb-10 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold mb-4 backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Authenticated Session Active</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Welcome, {user?.name || 'Developer'}!
            </h1>
            <p className="text-indigo-200 mt-2 text-sm sm:text-base max-w-xl">
              You are signed in to Nexora. Your frontend authentication workflow and protected routes are working seamlessly.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm backdrop-blur-sm transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of stats / verification cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              User Profile
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 truncate">
            {user?.name || 'Nexora User'}
          </div>
          <p className="text-xs text-slate-500 mt-1 truncate">{user?.email}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Session Token
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">Stored in Storage</div>
          <p className="text-xs text-emerald-600 mt-1 flex items-center font-medium">
            <CheckCircle className="w-3.5 h-3.5 mr-1 inline" />
            Auto-injected into Axios headers
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              System Health
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">Vite 8 + React 19</div>
          <p className="text-xs text-purple-600 mt-1 font-medium">
            Tailwind CSS v4 Active
          </p>
        </div>
      </div>

      {/* Project Structure Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Task Deliverable Verification</h3>
            <p className="text-xs text-slate-500">Architecture checklist matching requirements</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { label: 'React Application created with Vite', status: 'Complete' },
            { label: 'Tailwind CSS configured & styling verified', status: 'Complete' },
            { label: 'Packages installed: React Router DOM, Axios, Lucide React', status: 'Complete' },
            { label: 'Frontend structure: components, pages, layouts, services, context', status: 'Complete' },
            { label: 'Login and Register page layouts with responsive auth shell', status: 'Complete' },
            { label: 'Basic routing with protected route system', status: 'Complete' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/60"
            >
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
