import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#060813] text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950 relative">
      {/* Ambient Neon Backlights */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navbar stays fixed/sticky at the top on scroll */}
        <Navbar />
        {/* Main Content with top padding to account for fixed navbar */}
        <main className="flex-1 pt-16">
          {children || <Outlet />}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
