import React, { useState } from 'react';
import { User } from '../types';
import Button from './Button';

interface AuthViewProps {
  onAuthComplete: (user: User) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onAuthComplete }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Required fields missing.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');

    if (isLogin) {
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (user) {
        onAuthComplete(user);
      } else {
        setError('Authentication failed.');
      }
    } else {
      const existing = users.find((u: any) => u.email === email);
      if (existing) {
        setError('Subject ID exists.');
      } else {
        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          password,
        };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        onAuthComplete(newUser);
      }
    }
  };

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-2xl p-8 sm:p-10 relative z-0 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center mb-6 text-primary ring-1 ring-border shadow-sm relative group overflow-hidden">
          <span className="material-icons-round text-3xl relative z-10 text-primary">auto_stories</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{isLogin ? 'Welcome Back' : 'New Scholar'}</h2>
        <p className="text-sm text-muted-foreground font-medium text-center italic">{isLogin ? 'Resuming assessment session...' : 'Initiating learning journey...'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Email Address</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-icons-round text-muted-foreground text-lg group-focus-within:text-primary transition-colors">mail</span>
            </div>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:border-ring transition-all outline-none text-sm" 
              placeholder="smarty@example.com" 
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">Password</label>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-icons-round text-muted-foreground text-lg group-focus-within:text-primary transition-colors">lock</span>
            </div>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:border-ring transition-all outline-none text-sm" 
              placeholder="••••••••" 
              required
            />
          </div>
        </div>

        {error && <p className="text-destructive text-[10px] font-bold text-center uppercase tracking-widest">{error}</p>}

        <button 
          type="submit"
          className="w-full flex justify-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring focus:ring-offset-background transition-all active:scale-[0.98] mt-4 uppercase tracking-widest"
        >
          {isLogin ? 'Log In' : 'Sign Up'}
        </button>
      </form>

      <div className="mt-10 pt-6 border-t border-border text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          {isLogin ? "Need a new account? " : "Already registered? "}
          <span className="font-bold text-primary">{isLogin ? 'Sign up' : 'Log in'}</span>
        </button>
      </div>
    </div>
  );
};

export default AuthView;