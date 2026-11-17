import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = ({ children }) => {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#060813] flex items-center justify-center p-2 sm:p-4 lg:p-6 font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
      {/* Background ambient lighting matching Nexux electric ribbon theme */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-gradient-to-r from-cyan-500/15 via-blue-600/15 to-indigo-600/15 blur-[90px] rotate-[-10deg]" />
      </div>

      {/* Centered Modal / Card Container - Fits fully within viewport height without scroll */}
      <div className="relative z-10 w-full h-full max-h-[min(94vh,670px)] max-w-5xl flex items-center justify-center">
        {children || <Outlet />}
      </div>
    </div>
  );
};

export default AuthLayout;
