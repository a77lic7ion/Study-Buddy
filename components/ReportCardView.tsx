import React from 'react';
import { User, TestResult } from '../types';
import Button from './Button';

interface ReportCardViewProps {
  user: User;
  scores: TestResult[];
  onBack: () => void;
}

const ReportCardView: React.FC<ReportCardViewProps> = ({ user, scores, onBack }) => {
  // Aggregate data by Grade and Subject
  // Fix: Explicitly type the accumulator as Record<string, any> to avoid 'unknown' type inference in Object.values
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

  // Fix: Cast the resulting values to any[] to ensure elements have accessible properties
  const reportItems = Object.values(aggregatedData).sort((a: any, b: any) => {
    // Sort by Grade then Subject
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
    <div className="w-full max-w-4xl mx-auto animate-in fade-in zoom-in duration-500 bg-background/50 backdrop-blur-md rounded-2xl border border-border p-8 shadow-2xl relative">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-primary/50 to-primary rounded-t-2xl"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shadow-lg">
            <span className="material-icons-round text-4xl">history_edu</span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase italic">
              ACADEMIC <span className="text-primary">REPORT</span>
            </h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">
              NeuroForge Certification System
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="text-right">
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Overall Mastery</p>
             <p className={`text-3xl font-black ${overallAvg >= 80 ? 'text-green-500' : overallAvg >= 50 ? 'text-amber-500' : 'text-destructive'}`}>
               {overallAvg}%
             </p>
           </div>
           <Button onClick={onBack} variant="ghost" size="sm" className="ml-4">Return</Button>
        </div>
      </div>

      {honors && (
        <div className="mb-10 bg-primary/5 border border-primary/20 p-6 rounded-xl flex items-center justify-between shadow-inner animate-in slide-in-from-top-4 duration-700">
           <div className="flex items-center gap-4">
              <span className="material-icons-round text-4xl text-primary animate-pulse">military_tech</span>
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Institutional Distinction</p>
                <h2 className={`text-2xl font-black uppercase italic ${honors.color}`}>{honors.title}</h2>
              </div>
           </div>
           <div className="hidden md:block opacity-20">
              <span className="material-icons-round text-6xl">verified</span>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <div className="bg-card/50 border border-border p-6 rounded-xl shadow-lg">
           <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-4">Assessment Metrics</span>
           <div className="space-y-4">
              <div className="flex justify-between items-center">
                 <span className="text-xs font-medium">Total Evaluations</span>
                 <span className="font-bold text-primary">{scores.length}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-xs font-medium">Unique Subjects</span>
                 <span className="font-bold text-primary">{new Set(scores.map(s => s.subject)).size}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-xs font-medium">Grade Levels</span>
                 <span className="font-bold text-primary">{new Set(scores.map(s => s.grade)).size}</span>
              </div>
           </div>
        </div>

        <div className="bg-card/50 border border-border p-6 rounded-xl shadow-lg lg:col-span-2">
           <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-4">Performance Insights</span>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-secondary/30 rounded-lg border border-border">
                 <p className="text-[8px] font-bold text-muted-foreground uppercase mb-1">Highest Subject</p>
                 <p className="text-sm font-black truncate">
                   {/* Fix: Cast the reduced result to any to access 'subject' property safely */}
                   {reportItems.length > 0 ? (reportItems.reduce((prev: any, current: any) => (prev.totalScore / prev.count > current.totalScore / current.count) ? prev : current) as any).subject : "N/A"}
                 </p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg border border-border">
                 <p className="text-[8px] font-bold text-muted-foreground uppercase mb-1">Most Studied</p>
                 <p className="text-sm font-black truncate">
                   {/* Fix: Cast the reduced result to any to access 'subject' property safely */}
                   {reportItems.length > 0 ? (reportItems.reduce((prev: any, current: any) => (prev.count > current.count) ? prev : current) as any).subject : "N/A"}
                 </p>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-secondary/50 p-4 border-b border-border flex justify-between items-center">
          <h3 className="text-sm font-black uppercase tracking-widest">Mastery Transcript</h3>
          <span className="text-[10px] text-muted-foreground font-bold">{reportItems.length} records found</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border bg-secondary/20">
                <th className="p-4">Academic Level</th>
                <th className="p-4">Learning Module</th>
                <th className="p-4 text-center">Attempts</th>
                <th className="p-4 text-center">Peak Performance</th>
                <th className="p-4 text-right">Weighted Average</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reportItems.map((item: any, idx) => {
                const avg = Math.round(item.totalScore / item.count);
                return (
                  <tr key={idx} className="hover:bg-primary/5 transition-colors group">
                    <td className="p-4">
                      <span className="px-2 py-1 bg-secondary border border-border rounded text-[9px] font-bold group-hover:border-primary/30 transition-colors">
                        {item.grade}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-black group-hover:text-primary transition-colors">{item.subject}</p>
                      <p className="text-[8px] text-muted-foreground uppercase tracking-tighter mt-0.5">Last active: {new Date(item.latestDate).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-xs font-bold text-muted-foreground">{item.count}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-xs font-bold text-foreground">{item.bestScore}%</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`text-sm font-black ${avg >= 80 ? 'text-green-500' : avg >= 50 ? 'text-amber-500' : 'text-destructive'}`}>
                        {avg}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {reportItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-muted-foreground italic text-sm">
                    No academic records identified. Initiate learning modules to populate transcript.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10 flex flex-col md:flex-row items-center justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-widest gap-4">
         <div className="flex items-center gap-2">
            <span className="material-icons-round text-xs">shield</span>
            Cryptographically Verified via Local Storage
         </div>
         <div className="flex items-center gap-6">
            <span>Issue Date: {new Date().toLocaleDateString()}</span>
            <span>AuthID: {user.id.toUpperCase()}</span>
         </div>
      </div>
    </div>
  );
};

export default ReportCardView;