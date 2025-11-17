
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full text-center mb-8 md:mb-12">
      <div className="inline-block p-4 bg-slate-800 rounded-lg shadow-lg border border-slate-700">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-wider text-white">
          <span className="text-cyan-400">NS/TECH</span> Grade 6 Study Buddy
        </h1>
        <p className="text-sm text-slate-400">CAPS SA Curriculum 2025</p>
      </div>
    </header>
  );
};

export default Header;
