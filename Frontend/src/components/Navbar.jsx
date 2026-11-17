import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFirstName } from '../utils/userUtils';
import NexoraLogo from './common/NexoraLogo';
import {
  Sparkles,
  LogIn,
  UserPlus,
  LogOut,
  LayoutDashboard,
  Database,
  UploadCloud,
  BarChart3,
  Menu,
  X,
  Bell,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Detect scroll to fix and style navbar on scrolling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
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

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const notifications = [
    {
      id: 1,
      title: 'Workspace Initialized',
      desc: 'Platform stream engine active and ready for dataset uploads.',
      time: 'Just now',
    },
    {
      id: 2,
      title: 'Pipeline Ready',
      desc: 'Preprocessing baseline model inference operational.',
      time: '1h ago',
    },
    {
      id: 3,
      title: 'Security Sync',
      desc: 'JWT session authenticated with 256-bit encryption.',
      time: '2h ago',
    },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#060813]/95 backdrop-blur-2xl border-b border-cyan-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.8)]'
          : 'bg-[#060813]/60 backdrop-blur-md border-b border-cyan-500/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">
          {/* Left: Nexux-style Brand Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <NexoraLogo size="md" />
            </Link>
          </div>

          {/* Center: Desktop Navigation Links (Centered in the Navbar) */}
          <div className="hidden lg:flex items-center space-x-1.5 absolute left-1/2 -translate-x-1/2">
            <Link
              to="/"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive('/') && location.pathname === '/'
                  ? 'text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Home
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                    location.pathname === '/dashboard'
                      ? 'text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/dashboard/datasets"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                    location.pathname.startsWith('/dashboard/datasets')
                      ? 'text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Datasets</span>
                </Link>

                <Link
                  to="/dashboard/analytics"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                    location.pathname.startsWith('/dashboard/analytics')
                      ? 'text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-pink-400" />
                  <span>Analytics</span>
                </Link>
              </>
            ) : (
              <>
                <a
                  href="#tools"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  Tools
                </a>
                <a
                  href="#pipeline"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  Our Services
                </a>
                <a
                  href="#benchmarks"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  Benchmarks
                </a>
                <a
                  href="#faq"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  FAQ
                </a>
              </>
            )}
          </div>

          {/* Right Side Options & User Actions (Kept exactly as requested) */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {/* Glowing Quick Upload Action */}
                <Link
                  to="/dashboard/datasets/upload"
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_18px_rgba(6,182,212,0.35)] transition-all cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Dataset</span>
                </Link>

                {/* Notifications Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-slate-800 transition-colors relative cursor-pointer"
                    title="Notifications"
                    aria-label="View notifications"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#060813] animate-pulse" />
                  </button>

                  {/* Dropdown Content */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-[#0a0f24] rounded-2xl shadow-2xl border border-cyan-500/20 py-2 z-50 animate-fade-in backdrop-blur-xl">
                      <div className="px-4 py-2 border-b border-slate-800/80 flex items-center justify-between">
                        <span className="text-xs font-bold text-white">System Feed</span>
                        <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-semibold px-2 py-0.5 rounded-full">
                          Live
                        </span>
                      </div>
                      <div className="divide-y divide-slate-800/60 max-h-64 overflow-y-auto">
                        {notifications.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-semibold text-white">
                                {item.title}
                              </span>
                              <span className="text-[10px] text-slate-400">{item.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-tight">
                              {item.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Pill Menu with First Name */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center space-x-2 pl-2 pr-2.5 py-1 rounded-full bg-[#0d142d] hover:bg-[#121c3d] border border-cyan-500/25 transition-all cursor-pointer shadow-xs"
                    aria-label="User menu"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                      {getFirstName(user)[0]}
                    </div>
                    <span className="text-xs font-semibold text-slate-200 max-w-[120px] truncate">
                      {getFirstName(user)}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                  </button>

                  {/* Profile Dropdown Card */}
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-[#0a0f24] rounded-2xl shadow-2xl border border-cyan-500/20 py-2 z-50 animate-fade-in backdrop-blur-xl">
                      <div className="px-4 py-2.5 border-b border-slate-800/80">
                        <p className="text-xs font-bold text-white truncate">
                          {getFirstName(user)}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                        <div className="mt-1.5 flex items-center text-[10px] text-cyan-400 font-semibold">
                          <ShieldCheck className="w-3 h-3 mr-1 inline" />
                          <span>Enterprise Active</span>
                        </div>
                      </div>

                      <div className="py-1 text-xs text-slate-300">
                        <Link
                          to="/dashboard"
                          className="flex items-center space-x-2 px-4 py-2 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Workspace Overview</span>
                        </Link>
                        <Link
                          to="/dashboard/datasets"
                          className="flex items-center space-x-2 px-4 py-2 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <Database className="w-3.5 h-3.5 text-blue-400" />
                          <span>Datasets Catalog</span>
                        </Link>
                        <Link
                          to="/dashboard/datasets/upload"
                          className="flex items-center space-x-2 px-4 py-2 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Upload Dataset</span>
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-slate-800/80">
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
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sign In</span>
                </Link>
                {/* Nexux Get Started Glowing Pill */}
                <Link
                  to="/register"
                  className="flex items-center space-x-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#070b1c] border-b border-cyan-500/20 px-4 pt-3 pb-6 space-y-3 animate-fade-in shadow-2xl">
          <Link
            to="/"
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5"
          >
            Home
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5"
              >
                <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/dashboard/datasets"
                className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5"
              >
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Datasets</span>
              </Link>
              <Link
                to="/dashboard/analytics"
                className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5"
              >
                <BarChart3 className="w-4 h-4 text-pink-400" />
                <span>Analytics</span>
              </Link>
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-xs">
                    {getFirstName(user)[0]}
                  </div>
                  <span className="text-xs font-semibold text-white">{getFirstName(user)}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 flex flex-col space-y-2">
              <Link
                to="/login"
                className="text-center py-2 text-sm font-semibold text-slate-200 border border-slate-700 rounded-full"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-center py-2 text-sm font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 rounded-full shadow-lg shadow-cyan-500/30"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
