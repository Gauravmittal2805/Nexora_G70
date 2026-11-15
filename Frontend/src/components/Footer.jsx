import React from 'react';
import { Sparkles, Heart, Shield, Activity, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-slate-200/90 bg-white/80 backdrop-blur-md mt-auto transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8 pb-8 border-b border-slate-200/70">
          {/* Brand Info & Mission (Col 1 & 2) */}
          <div className="lg:col-span-2 space-y-3">
            <Link to="/" className="inline-flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Nexora
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">
              Enterprise data ingestion, schema validation, and intelligent ML preprocessing platform built for modern engineering teams.
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Systems Operational</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">v1.2.0 • React 19</span>
            </div>
          </div>

          {/* Product Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">
                  Overview & KPIs
                </Link>
              </li>
              <li>
                <Link to="/dashboard/datasets" className="hover:text-indigo-600 transition-colors">
                  Dataset Catalog
                </Link>
              </li>
              <li>
                <Link to="/dashboard/datasets/upload" className="hover:text-indigo-600 transition-colors">
                  Ingestion Dropzone
                </Link>
              </li>
              <li>
                <Link to="/dashboard/pipelines" className="hover:text-indigo-600 transition-colors">
                  ML Studio Pipelines
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Docs */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Resources
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Postman Collection available in Backend/postman_collection.json');
                  }}
                  className="hover:text-indigo-600 transition-colors flex items-center space-x-1"
                >
                  <span>API Collection</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Documentation: Ingestion accepts CSV, JSON, TSV up to 50MB with automatic type inference.');
                  }}
                  className="hover:text-indigo-600 transition-colors"
                >
                  Schema Docs
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Cloud Storage powered by S3-compatible Backblaze B2 bucket storage.');
                  }}
                  className="hover:text-indigo-600 transition-colors"
                >
                  Storage Specs
                </a>
              </li>
              <li>
                <Link to="/" className="hover:text-indigo-600 transition-colors">
                  Release Notes
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Security & Legal
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <span className="flex items-center text-slate-500">
                  <Shield className="w-3.5 h-3.5 text-indigo-500 mr-1.5" />
                  <span>SOC-2 Type II</span>
                </span>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Privacy Policy: End-to-end data encryption with TLS 1.3.');
                  }}
                  className="hover:text-indigo-600 transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Terms of Service: Standard Enterprise Developer License.');
                  }}
                  className="hover:text-indigo-600 transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@nexora.io"
                  className="hover:text-indigo-600 transition-colors"
                >
                  Developer Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span>© {new Date().getFullYear()} Nexora Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center text-xs text-slate-400">
            <span>Engineered with</span>
            <Heart className="w-3.5 h-3.5 mx-1 text-rose-500 fill-rose-500 inline" />
            <span>by Nexora Team • React 19 + Tailwind CSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
