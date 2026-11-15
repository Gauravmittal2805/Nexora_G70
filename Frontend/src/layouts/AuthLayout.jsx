import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Zap, Users, ArrowLeft } from 'lucide-react';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-800 antialiased">
      {/* Left Showcase Side (visible on lg screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white flex-col justify-between p-12 overflow-hidden">
        {/* Background decorative shapes & glows */}
        <div className="absolute top-0 -left-12 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-12 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-tight text-white block">Nexora</span>
              <span className="text-xs text-indigo-300 font-medium tracking-wider uppercase">Next-Gen Ecosystem</span>
            </div>
          </Link>
          <Link
            to="/"
            className="flex items-center text-xs font-medium text-indigo-200 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back to website
          </Link>
        </div>

        {/* Middle Feature Highlights */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-6">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>Powering Next-Gen Workspaces</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight text-white mb-6">
            Elevate your workflow with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">Nexora</span>
          </h1>
          <p className="text-indigo-200/90 text-base xl:text-lg max-w-lg leading-relaxed mb-8">
            Experience lightning-fast collaboration, smart analytics, and seamless productivity built for forward-thinking engineering teams.
          </p>

          <div className="space-y-4 max-w-md">
            <div className="flex items-center space-x-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Enterprise Security</h4>
                <p className="text-xs text-indigo-200/80">End-to-end encryption & secure JWT role management</p>
              </div>
            </div>

            <div className="flex items-center space-x-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-9 h-9 rounded-lg bg-pink-500/20 text-pink-300 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Team Collaboration</h4>
                <p className="text-xs text-indigo-200/80">Real-time sync and role-based workspace permissions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Testimonial / Footer */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-indigo-300/80">
          <span>© {new Date().getFullYear()} Nexora Inc.</span>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Help</a>
          </div>
        </div>
      </div>

      {/* Right / Main Auth Card Side */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-12 py-10">
        {/* Mobile top bar */}
        <div className="w-full max-w-md flex items-center justify-between lg:hidden mb-8">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl text-slate-900">Nexora</span>
          </Link>
          <Link
            to="/"
            className="flex items-center text-xs font-medium text-slate-600 hover:text-indigo-600"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Home
          </Link>
        </div>

        {/* Auth Content Container */}
        <div className="w-full max-w-md">
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
