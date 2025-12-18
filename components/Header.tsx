
import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user?: User | null;
  onLogout: () => void;
  onProfile: () => void;
  onSettings: () => void;
  onHome: () => void;
  showNav: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  user, 
  onLogout, 
  onProfile, 
  onSettings,
  onHome, 
  showNav, 
  isDarkMode, 
  onToggleTheme 
}) => {
  return (
    <header className="w-full px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between z-10 relative">
      <div className="flex items-center gap-2 sm:gap-3 cursor-pointer group" onClick={onHome}>
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center p-1 shadow-lg shadow-primary/5 ring-1 ring-border group-hover:scale-105 transition-transform overflow-hidden">
          <img src="/logo.png" alt="NeuroForge Logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-foreground leading-none uppercase italic">
            NEURO<span className="text-primary italic">FORGE</span>
          </h1>
          <span className="text-[0.55rem] sm:text-[0.65rem] font-black tracking-[0.2em] text-muted-foreground uppercase mt-1 hidden xs:block">Adaptive Intelligence</span>
        </div>
      </div>
      
      <div className="flex items-center gap-1 sm:gap-2">
        <button 
          onClick={onToggleTheme}
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <span className="material-icons-round text-lg sm:text-xl">
            {isDarkMode ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {showNav && user && (
          <div className="flex items-center gap-1 sm:gap-2 border-l border-border pl-2 sm:pl-4 ml-1 sm:ml-2">
            <div className="hidden lg:flex flex-col text-right mr-2">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">{user.profile?.grade || 'Scholar'}</span>
              <span className="text-[11px] font-black text-primary truncate max-w-[120px] leading-none uppercase italic">{user.profile?.subject || 'Mode'}</span>
            </div>
            
            <nav className="flex items-center gap-0.5 sm:gap-1">
              <button 
                onClick={onSettings}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary"
                title="System Settings"
              >
                <span className="material-icons-round text-lg sm:text-xl">settings</span>
              </button>
              <button 
                onClick={onProfile}
                className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary overflow-hidden border border-transparent hover:border-border"
                title="Dashboard"
              >
                {user.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-icons-round text-lg sm:text-xl">account_circle</span>
                )}
              </button>
              <button 
                onClick={onLogout}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                title="Logout"
              >
                <span className="material-icons-round text-lg sm:text-xl">logout</span>
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
