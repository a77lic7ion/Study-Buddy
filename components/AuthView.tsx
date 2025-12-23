import React, { useState } from 'react';
import { User } from '../types';
import Button from './Button';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

interface AuthViewProps {
  onAuthComplete: (user: User) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onAuthComplete }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const clearAllData = () => {
    if (confirm("This will delete all accounts and scores stored in this browser. Continue?")) {
      try {
        localStorage.clear();
        window.location.reload();
      } catch (e) {
        alert("Force reload failed. Please clear browsing data manually in browser settings.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Required fields missing.');
      setLoading(false);
      return;
    }

    await new Promise(res => setTimeout(res, 300));

    try {
      let users: User[] = [];
      const storedUsers = localStorage.getItem('users');
      if (storedUsers) {
        try {
          users = JSON.parse(storedUsers);
        } catch (e) {
          users = [];
        }
      }

      const normalizedEmail = email.toLowerCase().trim();

      if (isLogin) {
        const user = users.find((u: any) => u.email.toLowerCase().trim() === normalizedEmail && u.password === password);
        if (user) {
          try {
            onAuthComplete(user);
          } catch (sessionErr: any) {
            if (sessionErr.name?.includes('Quota') || sessionErr.message?.includes('quota')) {
              setError('Session storage full. Please wipe local data.');
            } else {
              setError('Session error. Try again.');
            }
          }
        } else {
          setError('Authentication failed. Check credentials.');
        }
      } else {
        const existing = users.find((u: any) => u.email.toLowerCase().trim() === normalizedEmail);
        if (existing) {
          setError('Account already exists. Try logging in.');
        } else {
          const newUser: User = {
            id: Math.random().toString(36).substring(2, 11),
            email: normalizedEmail,
            password,
          };
          users.push(newUser);
          
          try {
            localStorage.setItem('users', JSON.stringify(users));
            onAuthComplete(newUser);
          } catch (storageError: any) {
            if (storageError.name?.includes('Quota') || storageError.message?.includes('quota') || storageError.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
              setError('Storage quota exceeded. Your browser storage is full.');
            } else {
              throw storageError;
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Auth system failure:", err);
      if (err.name?.includes('Quota') || err.message?.includes('quota')) {
        setError('Storage is full. Cannot save new data.');
      } else {
        setError('System storage error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-2xl p-8 sm:p-10 relative z-0 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center mb-6 text-primary ring-1 ring-border shadow-sm relative group overflow-hidden">
          <span className={`material-icons-round text-3xl relative z-10 text-primary ${loading ? 'animate-spin' : ''}`}>
            {loading ? 'sync' : 'auto_stories'}
          </span>
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
              disabled={loading}
              className="block w-full pl-10 pr-3 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:border-ring transition-all outline-none text-sm disabled:opacity-50" 
              placeholder="scholar@neuroforge.ai" 
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Password</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-icons-round text-muted-foreground text-lg group-focus-within:text-primary transition-colors">lock</span>
            </div>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="block w-full pl-10 pr-3 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:border-ring transition-all outline-none text-sm disabled:opacity-50" 
              placeholder="••••••••" 
              required
            />
          </div>
        </div>

        {error && (
          <div className="space-y-2">
            <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
               <span className="material-icons-round text-destructive text-sm">error</span>
               <p className="text-destructive text-[10px] font-bold uppercase tracking-widest leading-none flex-grow">{error}</p>
            </div>
            <Button onClick={clearAllData} type="button" variant="secondary" size="sm" className="w-full text-[9px] py-2 uppercase tracking-widest border-destructive/20 text-destructive hover:bg-destructive/10">
              Emergency Reset: Wipe Local Data
            </Button>
          </div>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring focus:ring-offset-background transition-all active:scale-[0.98] mt-4 uppercase tracking-widest disabled:opacity-50"
        >
          {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
        </button>
      </form>

      <div className="mt-10 pt-6 border-t border-border text-center">
        <button
          onClick={() => { setIsLogin(!isLogin); setError(''); }}
          disabled={loading}
          className="text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
        >
          {isLogin ? "Need a new account? " : "Already registered? "}
          <span className="font-bold text-primary">{isLogin ? 'Sign up' : 'Log in'}</span>
        </button>
      </div>
      <div className="mt-6 flex justify-center items-center">
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            const decoded: { email: string; name: string } = jwtDecode(
              credentialResponse.credential!
            );
            let users: User[] = [];
            const storedUsers = localStorage.getItem('users');
            if (storedUsers) {
              try {
                users = JSON.parse(storedUsers);
              } catch (e) {
                users = [];
              }
            }
            const normalizedEmail = decoded.email.toLowerCase().trim();
            const user = users.find(
              (u: any) => u.email.toLowerCase().trim() === normalizedEmail
            );
            if (user) {
              onAuthComplete(user);
            } else {
              const newUser: User = {
                id: Math.random().toString(36).substring(2, 11),
                email: normalizedEmail,
                password: '',
              };
              users.push(newUser);
              localStorage.setItem('users', JSON.stringify(users));
              onAuthComplete(newUser);
            }
          }}
          onError={() => {
            console.log('Login Failed');
          }}
        />
      </div>
    </div>
  );
};

export default AuthView;