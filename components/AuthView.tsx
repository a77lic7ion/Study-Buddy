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
      setError('Please fill in all fields.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');

    if (isLogin) {
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (user) {
        onAuthComplete(user);
      } else {
        setError('Invalid email or password.');
      }
    } else {
      const existing = users.find((u: any) => u.email === email);
      if (existing) {
        setError('User already exists.');
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
    <div className="max-w-md w-full mx-auto bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <div className="inline-block bg-cyan-500 p-3 rounded-xl mb-4">
          <svg className="w-8 h-8 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0112 3v8h8a10.003 10.003 0 01-9.571 2.753" />
          </svg>
        </div>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">
          Study<span className="text-cyan-400">Buddy</span>
        </h2>
        <p className="text-slate-400 mt-2">{isLogin ? 'Welcome back, Scholar!' : 'Start your AI learning journey'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            placeholder="e.g. smarty@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-red-400 text-sm font-bold text-center">{error}</p>}

        <Button type="submit" size="lg" className="w-full mt-4">
          {isLogin ? 'Login' : 'Create Account'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-cyan-400 text-sm font-bold hover:underline"
        >
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  );
};

export default AuthView;