import React from 'react';
import { TestResult } from '../types';

interface ProgressGraphProps {
  scores: TestResult[];
}

const ProgressGraph: React.FC<ProgressGraphProps> = ({ scores }) => {
  return (
    <div className="w-full bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
      <h2 className="text-xl font-bold text-cyan-400 mb-4 text-left">Your Progress</h2>
      <div className="flex items-end justify-center gap-2 h-48 p-4 border-t border-b border-slate-600">
        {scores.map((result, index) => {
          const date = new Date(result.date);
          const formattedDate = `${date.getDate()}/${date.getMonth() + 1}`;
          const barColor = result.type === 'quiz' ? 'bg-indigo-500 hover:bg-indigo-400' : 'bg-cyan-500 hover:bg-cyan-400';

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1 group">
              <div 
                className={`w-full rounded-t-md transition-all duration-300 ${barColor}`} 
                style={{ height: `${result.score}%` }}
                title={`Type: ${result.type}\nScore: ${result.score}%`}
              >
                <span className="text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-full">
                  {result.score}%
                </span>
              </div>
              <span className="text-xs text-slate-400">{formattedDate}</span>
            </div>
          );
        })}
      </div>
       <div className="flex justify-center items-center gap-6 mt-4">
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span className="text-sm text-slate-400">Quiz</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
            <span className="text-sm text-slate-400">Flashcard Test</span>
        </div>
      </div>
      <p className="text-sm text-slate-500 mt-2 text-center">Showing your last {scores.length} attempt(s).</p>
    </div>
  );
};

export default ProgressGraph;
