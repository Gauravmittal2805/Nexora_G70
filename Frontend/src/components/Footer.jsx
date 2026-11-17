import React from 'react';
import { Heart, Shield, Activity, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import NexoraLogo from './common/NexoraLogo';

const Footer = () => {
  return (
    <footer className="border-t border-cyan-500/15 bg-[#04060e] text-slate-400 mt-auto transition-all relative overflow-hidden">
      {/* Subtle bottom neon ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-cyan-500/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Top 5-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8 pb-8 border-b border-slate-800/80">
          {/* Brand Info & Mission (Col 1 & 2) */}
          <div className="lg:col-span-2 space-y-3.5">
            <Link to="/" className="inline-flex items-center group">
              <NexoraLogo size="md" />
            </Link>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              Autonomous enterprise tabular data ingestion, schema validation, and intelligent ML preprocessing platform built for modern engineering teams.
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>All Systems Operational</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">v2.0 • React 19 + Dark Nexux</span>
            </div>
          </div>

          {/* Product Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Platform</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/dashboard" className="hover:text-cyan-400 transition-colors">
                  Overview & KPIs
                </Link>
              </li>
              <li>
                <Link to="/dashboard/datasets" className="hover:text-cyan-400 transition-colors">
                  Dataset Catalog
                </Link>
              </li>
              <li>
                <Link to="/dashboard/datasets/upload" className="hover:text-cyan-400 transition-colors">
                  Ingestion Dropzone
                </Link>
              </li>
              <li>
                <Link to="/dashboard/datasets/mapping" className="hover:text-cyan-400 transition-colors">
                  Field Mapping Studio
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Docs */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Resources</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Postman Collection available in Backend/postman_collection.json');
                  }}
                  className="hover:text-cyan-400 transition-colors flex items-center space-x-1"
                >
                  <span>API Collection</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Documentation: Ingestion accepts CSV, JSON, TSV up to 50MB with automatic type inference.');
                  }}
                  className="hover:text-cyan-400 transition-colors"
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
                  className="hover:text-cyan-400 transition-colors"
                >
                  Storage Specs
                </a>
              </li>
              <li>
                <Link to="/" className="hover:text-cyan-400 transition-colors">
                  Release Notes
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>Security</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <span className="flex items-center text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-cyan-400 mr-1.5" />
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
                  className="hover:text-cyan-400 transition-colors"
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
                  className="hover:text-cyan-400 transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@nexora.io"
                  className="hover:text-cyan-400 transition-colors"
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

          <div className="flex items-center text-xs text-slate-500">
            <span>Powered by</span>
            <span className="text-cyan-400 font-bold mx-1">Nexora AI Engine</span>
            <span>• React 19 + Tailwind CSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
