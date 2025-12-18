import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user?: User | null;
  onLogout: () => void;
  onProfile: () => void;
  onHome: () => void;
  showNav: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  user, 
  onLogout, 
  onProfile, 
  onHome, 
  showNav, 
  isDarkMode, 
  onToggleTheme 
}) => {
  return (
    <header className="w-full px-6 py-6 flex items-center justify-between z-10 relative">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={onHome}>
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 ring-1 ring-border group-hover:scale-105 transition-transform">
          <span className="material-icons-round text-2xl">hardware</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight text-foreground leading-none">
            NEURO<span className="text-primary">FORGE</span>
          </h1>
          <span className="text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground uppercase mt-1">Adaptive Intelligence</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={onToggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <span className="material-icons-round text-xl">
            {isDarkMode ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {showNav && user && (
          <div className="flex items-center gap-4 border-l border-border pl-4 ml-2">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{user.profile?.grade || 'Scholar'}</span>
              <span className="text-xs font-bold text-primary truncate max-w-[150px]">{user.profile?.subject || 'Assessment Mode'}</span>
            </div>
            
            <div className="h-8 w-px bg-border mx-2 hidden md:block"></div>

            <nav className="flex items-center gap-1">
              <button 
                onClick={onProfile}
                className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary overflow-hidden border border-transparent hover:border-border"
                title="Dashboard"
              >
                {user.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-icons-round text-xl">account_circle</span>
                )}
              </button>
              <button 
                onClick={onLogout}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                title="Logout"
              >
                <span className="material-icons-round text-xl">logout</span>
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;