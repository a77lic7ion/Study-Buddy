
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseClasses = "font-bold py-2 px-4 rounded-lg transition-transform transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900";

  const variantClasses = {
    primary: 'bg-cyan-500 hover:bg-cyan-600 text-white focus:ring-cyan-400',
    secondary: 'bg-indigo-500 hover:bg-indigo-600 text-white focus:ring-indigo-400',
    ghost: 'bg-transparent hover:bg-slate-700 text-slate-300 border border-slate-600 focus:ring-slate-500',
  };

  const sizeClasses = {
    sm: 'text-sm py-1 px-3',
    md: 'text-base py-2 px-5',
    lg: 'text-lg py-3 px-8',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
