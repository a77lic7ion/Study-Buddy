import React, { useEffect, useState } from 'react';

interface IntroSequenceProps {
  onComplete: () => void;
}

const IntroSequence: React.FC<IntroSequenceProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 800),   // System Initialize
      setTimeout(() => setStage(2), 2000),  // Neural Sync
      setTimeout(() => setStage(3), 3200),  // Adaptive AI Load
      setTimeout(() => onComplete(), 4500), // Finish
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, [onComplete]);

  const stages = [
    "INITIALIZING CORE...",
    "SYNCING NEURAL PATHWAYS...",
    "CALIBRATING ADAPTIVE ENGINE...",
    "SYSTEM READY"
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center font-mono overflow-hidden">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="relative flex flex-col items-center">
        {/* Animated Central Node */}
        <div className="relative w-32 h-32 mb-12">
          <div className="absolute inset-0 border-2 border-primary rounded-full animate-ping opacity-20"></div>
          <div className="absolute inset-2 border-2 border-primary/40 rounded-lg animate-spin-slow"></div>
          <div className="absolute inset-4 bg-primary/20 rounded flex items-center justify-center backdrop-blur-md border border-primary/30">
            <span className="material-icons-round text-primary text-4xl animate-pulse">auto_stories</span>
          </div>
        </div>

        {/* Text Sequence */}
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-black tracking-[0.4em] text-foreground flex items-center justify-center gap-2">
            STUDY<span className="text-primary">BUDDY</span>
          </h1>
          <div className="h-6 flex items-center justify-center">
             <span className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase transition-all duration-500">
               {stages[stage]}
             </span>
          </div>
        </div>

        {/* Loading Bar */}
        <div className="w-64 h-1 bg-secondary rounded-full mt-10 overflow-hidden relative border border-border">
          <div 
            className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(79,70,229,0.8)]" 
            style={{ width: `${(stage + 1) * 25}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default IntroSequence;