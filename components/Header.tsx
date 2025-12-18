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
    <header className="w-full px-6 py-6 flex items-center justify-between z-10 relative">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={onHome}>
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 ring-1 ring-border group-hover:scale-105 transition-transform">
          <span className="material-icons-round text-2xl">menu_book</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight text-foreground leading-none">
            STUDY<span className="text-primary">BUDDY</span>
          </h1>
          <span className="text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground uppercase mt-1">Adaptive AI</span>
        </div>
      </div>
      
      {showNav && (
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{profile?.grade || 'Scholar'}</span>
            <span className="text-xs font-bold text-primary truncate max-w-[150px]">{profile?.subject || 'Assessment Mode'}</span>
          </div>
          
          <div className="h-8 w-px bg-border mx-2 hidden md:block"></div>

          <nav className="flex items-center gap-1">
            <button 
              onClick={onProfile}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary"
              title="Dashboard"
            >
              <span className="material-icons-round text-xl">account_circle</span>
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
    </header>
  );
};

export default Header;