import React from 'react';
import { TestResult } from '../types';

interface ProgressGraphProps {
  scores: TestResult[];
}

const ProgressGraph: React.FC<ProgressGraphProps> = ({ scores }) => {
  return (
    <div className="w-full bg-card p-8 rounded-lg shadow-2xl border border-border relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5">
         <span className="material-icons-round text-7xl">trending_up</span>
      </div>
      <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
        Neural Growth Data
      </h2>
      
      <div className="flex items-end justify-between gap-3 h-48 px-2 border-b border-border mb-6">
        {scores.length > 0 ? scores.map((result, index) => {
          const date = new Date(result.date);
          const formattedDate = `${date.getDate()}/${date.getMonth() + 1}`;
          const isQuiz = result.type === 'quiz';
          const barColor = isQuiz ? 'bg-primary' : 'bg-primary/40';

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
              <div 
                className={`w-full rounded-t-sm transition-all duration-500 cursor-help relative ${barColor} hover:brightness-110 shadow-lg`} 
                style={{ height: `${result.score}%` }}
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {result.score}% {isQuiz ? 'QUIZ' : 'FLSH'}
                </div>
              </div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase">{formattedDate}</span>
            </div>
          );
        }) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-xs text-muted-foreground italic uppercase tracking-widest">Awaiting assessment data...</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_5px_rgba(99,102,241,0.5)]"></div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Adaptive Quiz</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary/40"></div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recall Sequence</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressGraph;