import React from 'react';
import { Sparkles, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white/70 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">Nexora</span>
            <span className="text-xs text-slate-400 ml-2">© {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-6 text-sm text-slate-500">
            <Link to="/" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
            <Link to="/" className="hover:text-indigo-600 transition-colors">Terms of Service</Link>
            <Link to="/" className="hover:text-indigo-600 transition-colors">Support</Link>
          </div>

          <div className="flex items-center text-xs text-slate-400">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 mx-1 text-rose-500 fill-rose-500 inline" />
            <span>by Frontend Team</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
