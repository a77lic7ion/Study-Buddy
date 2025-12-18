
import React from 'react';
import { User, TestResult } from '../types';
import Button from './Button';

interface ReportCardViewProps {
  user: User;
  scores: TestResult[];
  onBack: () => void;
}

const ReportCardView: React.FC<ReportCardViewProps> = ({ user, scores, onBack }) => {
  const aggregatedData = scores.reduce<Record<string, any>>((acc, curr) => {
    const key = `${curr.grade} - ${curr.subject}`;
    if (!acc[key]) {
      acc[key] = {
        grade: curr.grade,
        subject: curr.subject,
        totalScore: 0,
        count: 0,
        bestScore: 0,
        latestDate: curr.date
      };
    }
    acc[key].totalScore += curr.score;
    acc[key].count += 1;
    acc[key].bestScore = Math.max(acc[key].bestScore, curr.score);
    if (new Date(curr.date) > new Date(acc[key].latestDate)) {
      acc[key].latestDate = curr.date;
    }
    return acc;
  }, {});

  const reportItems = Object.values(aggregatedData).sort((a: any, b: any) => {
    if (a.grade !== b.grade) return b.grade.localeCompare(a.grade);
    return a.subject.localeCompare(b.subject);
  }) as any[];

  const overallAvg = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length)
    : 0;

  const getAcademicHonors = (avg: number) => {
    if (avg >= 95) return { title: "Summa Cum Laude", color: "text-primary" };
    if (avg >= 90) return { title: "Magna Cum Laude", color: "text-primary/80" };
    if (avg >= 85) return { title: "Cum Laude", color: "text-green-500" };
    if (avg >= 75) return { title: "Honor Roll", color: "text-amber-500" };
    return null;
  };

  const honors = getAcademicHonors(overallAvg);

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in zoom-in duration-500 bg-background/50 backdrop-blur-md rounded-2xl border border-border p-4 sm:p-8 shadow-2xl relative mb-12">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-primary/50 to-primary rounded-t-2xl"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 sm:mb-10 gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shadow-lg flex-shrink-0">
            <span className="material-icons-round text-3xl sm:text-4xl">history_edu</span>
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-foreground tracking-tighter uppercase italic italic">
              ACADEMIC <span className="text-primary italic">REPORT</span>
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-1">
              NeuroForge Engine Certification
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
           <div className="text-left md:text-right">
             <p className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Global Mastery</p>
             <p className={`text-2xl sm:text-3xl font-black leading-none ${overallAvg >= 80 ? 'text-green-500' : overallAvg >= 50 ? 'text-amber-500' : 'text-destructive'}`}>
               {overallAvg}%
             </p>
           </div>
           <Button onClick={onBack} variant="ghost" size="sm" className="px-6">Return</Button>
        </div>
      </div>

      {honors && (
        <div className="mb-8 sm:mb-10 bg-primary/5 border border-primary/20 p-5 sm:p-6 rounded-xl flex items-center justify-between shadow-inner animate-in slide-in-from-top-4 duration-700">
           <div className="flex items-center gap-3 sm:gap-4">
              <span className="material-icons-round text-3xl sm:text-4xl text-primary animate-pulse">military_tech</span>
              <div>
                <p className="text-[8px] sm:text-[10px] font-black text-primary uppercase tracking-[0.2em] sm:tracking-[0.3em]">Institutional Distinction</p>
                <h2 className={`text-lg sm:text-2xl font-black uppercase italic ${honors.color} leading-none mt-1`}>{honors.title}</h2>
              </div>
           </div>
           <div className="hidden sm:block opacity-10">
              <span className="material-icons-round text-5xl">verified</span>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
        <div className="bg-card/50 border border-border p-5 sm:p-6 rounded-xl shadow-lg">
           <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-4">Core Metrics</span>
           <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                 <span className="font-medium opacity-70">Cycles</span>
                 <span className="font-black text-primary">{scores.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                 <span className="font-medium opacity-70">Modules</span>
                 <span className="font-black text-primary">{new Set(scores.map(s => s.subject)).size}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                 <span className="font-medium opacity-70">Levels</span>
                 <span className="font-black text-primary">{new Set(scores.map(s => s.grade)).size}</span>
              </div>
           </div>
        </div>

        <div className="bg-card/50 border border-border p-5 sm:p-6 rounded-xl shadow-lg md:col-span-2">
           <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-4">Mastery Insights</span>
           <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 bg-secondary/30 rounded-lg border border-border">
                 <p className="text-[8px] font-bold text-muted-foreground uppercase mb-1">Apex Module</p>
                 <p className="text-xs sm:text-sm font-black truncate uppercase italic italic">
                   {reportItems.length > 0 ? (reportItems.reduce((prev: any, current: any) => (prev.totalScore / prev.count > current.totalScore / current.count) ? prev : current) as any).subject : "N/A"}
                 </p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg border border-border">
                 <p className="text-[8px] font-bold text-muted-foreground uppercase mb-1">Target Load</p>
                 <p className="text-xs sm:text-sm font-black truncate uppercase italic italic">
                   {reportItems.length > 0 ? (reportItems.reduce((prev: any, current: any) => (prev.count > current.count) ? prev : current) as any).subject : "N/A"}
                 </p>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl relative">
        <div className="bg-secondary/50 p-4 border-b border-border flex justify-between items-center">
          <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Mastery Transcript</h3>
          <span className="text-[8px] sm:text-[9px] text-muted-foreground font-bold">{reportItems.length} RECORDS SYNC'D</span>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[600px] xs:min-w-0">
            <thead>
              <tr className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border bg-secondary/20">
                <th className="p-4">Level</th>
                <th className="p-4">Module</th>
                <th className="p-4 text-center">Load</th>
                <th className="p-4 text-center">Apex</th>
                <th className="p-4 text-right">Avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reportItems.map((item: any, idx) => {
                const avg = Math.round(item.totalScore / item.count);
                return (
                  <tr key={idx} className="hover:bg-primary/5 transition-colors group">
                    <td className="p-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 sm:py-1 bg-secondary border border-border rounded text-[8px] sm:text-[9px] font-bold group-hover:border-primary/30 transition-colors">
                        {item.grade}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-xs sm:text-sm font-black group-hover:text-primary transition-colors uppercase italic italic leading-none">{item.subject}</p>
                      <p className="text-[7px] sm:text-[8px] text-muted-foreground uppercase tracking-tighter mt-1">LATEST: {new Date(item.latestDate).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-[10px] sm:text-xs font-bold text-muted-foreground">{item.count}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-[10px] sm:text-xs font-bold text-foreground">{item.bestScore}%</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`text-xs sm:text-sm font-black ${avg >= 80 ? 'text-green-500' : avg >= 50 ? 'text-amber-500' : 'text-destructive'}`}>
                        {avg}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {reportItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground italic text-xs font-bold uppercase tracking-widest opacity-30">
                    Neural Transcript Empty. Initiate Cycles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 sm:mt-10 flex flex-col md:flex-row items-center justify-between text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-widest gap-4">
         <div className="flex items-center gap-2">
            <span className="material-icons-round text-[10px] sm:text-xs">shield</span>
            Verified via Local Persistence
         </div>
         <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
            <span>SYNC: {new Date().toLocaleDateString()}</span>
            <span>ID: {user.id.toUpperCase()}</span>
         </div>
      </div>
    </div>
  );
};

export default ReportCardView;
