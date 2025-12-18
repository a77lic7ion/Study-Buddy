import React from 'react';
import { TestResult } from '../types';

interface ProgressGraphProps {
  scores: TestResult[];
}

const ProgressGraph: React.FC<ProgressGraphProps> = ({ scores }) => {
  const average = scores.length > 0 
    ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length) 
    : 0;

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
         <span className="material-icons-round text-8xl">trending_up</span>
      </div>
      
      <div className="flex justify-between items-start mb-12">
        <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.8)]"></span>
          Neural Growth Data
        </h2>
        
        {scores.length > 0 && (
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">Subject Mastery Avg</span>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black text-foreground drop-shadow-lg">{average}%</span>
              <span className="material-icons-round text-primary text-2xl animate-bounce">north_east</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-grow flex items-end justify-between gap-4 h-64 px-2 border-b border-border/50 mb-8 relative">
        {/* Average Line */}
        {scores.length > 1 && (
          <div 
            className="absolute left-0 right-0 border-t border-dashed border-primary/40 z-0 transition-all duration-1000 flex justify-end"
            style={{ bottom: `${average}%` }}
          >
            <span className="bg-background/80 backdrop-blur-sm px-2 text-[8px] font-black text-primary uppercase tracking-widest -mt-2.5">AVG Threshold</span>
          </div>
        )}

        {scores.length > 0 ? scores.map((result, index) => {
          const date = new Date(result.date);
          const formattedDate = `${date.getDate()}/${date.getMonth() + 1}`;
          const isQuiz = result.type === 'quiz';
          const barColor = isQuiz ? 'bg-primary' : 'bg-primary/30';

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-3 group relative z-10">
              <div 
                className={`w-full rounded-t-lg transition-all duration-700 cursor-help relative ${barColor} hover:brightness-125 shadow-[0_-4px_15px_rgba(79,70,229,0.1)] group-hover:shadow-[0_-4px_25px_rgba(79,70,229,0.3)]`} 
                style={{ height: `${result.score}%` }}
              >
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-foreground text-background px-3 py-1.5 rounded-lg text-[10px] font-black opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-20 shadow-xl translate-y-2 group-hover:translate-y-0">
                  {result.score}% {isQuiz ? 'ADAPTIVE QUIZ' : 'RECALL SEQUENCE'}
                </div>
              </div>
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                {formattedDate}
              </span>
            </div>
          );
        }) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.5em] italic opacity-20">Awaiting Assessment Data Sync...</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-8 bg-secondary/10 p-4 rounded-xl border border-border/30">
        <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(79,70,229,0.6)]"></div>
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Adaptive Quiz</span>
        </div>
        <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-primary/30"></div>
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Recall Sequence</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressGraph;