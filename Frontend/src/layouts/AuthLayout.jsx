import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = ({ children }) => {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#dce3ec] flex items-center justify-center p-2 sm:p-4 lg:p-6 font-sans antialiased selection:bg-amber-400 selection:text-slate-950">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl" />
      </div>

      {/* Centered Modal / Card Container - Fits fully within viewport height without scroll */}
      <div className="relative z-10 w-full h-full max-h-[min(94vh,670px)] max-w-5xl flex items-center justify-center">
        {children || <Outlet />}
      </div>
    </div>
  );
};

export default AuthLayout;
