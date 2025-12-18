import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="relative w-20 h-20">
      <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
      <div className="absolute inset-2 border-r-2 border-primary/40 rounded-full animate-spin-slow"></div>
      <div className="absolute inset-4 border-b-2 border-primary/20 rounded-full animate-spin-reverse"></div>
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;