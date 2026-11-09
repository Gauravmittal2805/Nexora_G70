import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Layers,
  Code2,
  CheckCircle,
  LayoutDashboard,
  Cpu,
} from 'lucide-react';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-100/60 via-purple-50/40 to-transparent blur-2xl pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-8 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Nexora Architecture • React 19 + Tailwind CSS + Vite</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          Empowering Next-Generation{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            Enterprise Apps
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Robust, modern authentication UI and scalable frontend architecture configured with React Router, Axios API services, and responsive Tailwind layouts.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/25 transition-all text-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Go to Dashboard ({user?.name || 'Account'})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/25 transition-all text-sm group"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 shadow-sm transition-all text-sm"
              >
                <span>Sign In</span>
              </Link>
            </>
          )}
        </div>

        {/* Live Tech Stack Badge Strip */}
        <div className="mt-16 pt-8 border-t border-slate-200/80 max-w-4xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">
            Configured Tech Stack
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="p-4 rounded-xl bg-white border border-slate-200/70 shadow-xs">
              <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                <Cpu className="w-4 h-4" />
                <span className="font-bold text-sm text-slate-900">React 19 & Vite</span>
              </div>
              <p className="text-xs text-slate-500">Ultra-fast bundling & latest component ecosystem.</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/70 shadow-xs">
              <div className="flex items-center space-x-2 text-purple-600 mb-1">
                <Layers className="w-4 h-4" />
                <span className="font-bold text-sm text-slate-900">Tailwind CSS</span>
              </div>
              <p className="text-xs text-slate-500">Modern utility-first styling with high performance.</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/70 shadow-xs">
              <div className="flex items-center space-x-2 text-pink-600 mb-1">
                <Code2 className="w-4 h-4" />
                <span className="font-bold text-sm text-slate-900">React Router 7</span>
              </div>
              <p className="text-xs text-slate-500">Client-side declarative routing and protected routes.</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/70 shadow-xs">
              <div className="flex items-center space-x-2 text-emerald-600 mb-1">
                <Zap className="w-4 h-4" />
                <span className="font-bold text-sm text-slate-900">Axios & Lucide</span>
              </div>
              <p className="text-xs text-slate-500">Intercepted HTTP requests & crisp modern iconography.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Production-Grade Frontend Foundation
            </h2>
            <p className="mt-3 text-slate-500 text-base">
              Clean separation of concerns with components, pages, layouts, services, and context.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-6 shadow-md shadow-indigo-600/20">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Secure Authentication Flow</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Full login and registration interface featuring form validation, dynamic password strength meter, JWT token persistence, and auth context.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center"><CheckCircle className="w-3.5 h-3.5 text-indigo-600 mr-2" /> Live form field validation</li>
                <li className="flex items-center"><CheckCircle className="w-3.5 h-3.5 text-indigo-600 mr-2" /> Show/Hide password toggle</li>
                <li className="flex items-center"><CheckCircle className="w-3.5 h-3.5 text-indigo-600 mr-2" /> Auto Bearer token injection</li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-500/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-6 shadow-md shadow-purple-600/20">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Modular Layout System</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Dedicated split-screen AuthLayout for seamless onboarding alongside MainLayout with responsive navigation and sticky headers.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center"><CheckCircle className="w-3.5 h-3.5 text-purple-600 mr-2" /> Responsive mobile navigation</li>
                <li className="flex items-center"><CheckCircle className="w-3.5 h-3.5 text-purple-600 mr-2" /> Split-screen branding sidebar</li>
                <li className="flex items-center"><CheckCircle className="w-3.5 h-3.5 text-purple-600 mr-2" /> Protected routes & redirect state</li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-pink-200 hover:shadow-lg hover:shadow-pink-500/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-pink-600 text-white flex items-center justify-center mb-6 shadow-md shadow-pink-600/20">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Service-Oriented Architecture</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Configured Axios service layer with interceptors ready to communicate with the Nexora backend REST APIs.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center"><CheckCircle className="w-3.5 h-3.5 text-pink-600 mr-2" /> Configurable base URL & timeouts</li>
                <li className="flex items-center"><CheckCircle className="w-3.5 h-3.5 text-pink-600 mr-2" /> Global response interceptors</li>
                <li className="flex items-center"><CheckCircle className="w-3.5 h-3.5 text-pink-600 mr-2" /> Offline demo fallback capability</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
