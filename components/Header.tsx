import React from 'react';
import { UserProfile } from '../types';

interface HeaderProps {
  profile?: UserProfile;
  onLogout: () => void;
  onProfile: () => void;
  onHome: () => void;
  showNav: boolean;
}

const Header: React.FC<HeaderProps> = ({ profile, onLogout, onProfile, onHome, showNav }) => {
  return (
    <header className="w-full flex justify-between items-center mb-8 md:mb-12 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-md sticky top-4 z-50">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={onHome}>
        <div className="bg-cyan-500 p-2 rounded-lg group-hover:rotate-12 transition-transform">
          <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-white uppercase italic">
            Study<span className="text-cyan-400">Buddy</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Adaptive AI</p>
        </div>
      </div>
      
      {showNav && (
        <div className="flex items-center gap-2 sm:gap-6">
          <div className="hidden sm:flex flex-col text-right mr-2">
            <p className="text-xs font-bold text-slate-400 uppercase">{profile?.grade || 'Welcome'}</p>
            <p className="text-sm font-black text-cyan-400 truncate max-w-[120px]">{profile?.subject || 'Scholar'}</p>
          </div>
          
          <nav className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={onProfile}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
              title="View Profile"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            <button 
              onClick={onLogout}
              className="p-2 hover:bg-red-900/20 rounded-lg transition-colors text-slate-400 hover:text-red-400"
              title="Logout"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;