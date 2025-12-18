import React, { useRef } from 'react';
import { User, TestResult } from '../types';
import Button from './Button';
import ProgressGraph from './ProgressGraph';

interface ProfileViewProps {
  user: User;
  scores: TestResult[];
  onBack: () => void;
  onUpdateUser: (updatedUser: User) => void;
  onOpenReportCard: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, scores, onBack, onUpdateUser, onOpenReportCard }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group scores by subject for the "Subject Mastery" overview
  const subjectStats = scores.reduce((acc: any, curr) => {
    if (!acc[curr.subject]) acc[curr.subject] = { total: 0, count: 0, best: 0 };
    acc[curr.subject].total += curr.score;
    acc[curr.subject].count += 1;
    acc[curr.subject].best = Math.max(acc[curr.subject].best, curr.score);
    return acc;
  }, {});

  const currentSubject = user.profile?.subject || 'None';
  
  // Gaps are subject-specific, so we only show them for the ACTIVE subject to avoid clutter
  const weakKey = `weakTopics_${user.id}_${user.profile?.grade}_${currentSubject}`;
  const weakTopics = JSON.parse(localStorage.getItem(weakKey) || '[]');

  const avgScore = scores.length > 0 
    ? Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length) 
    : 0;

  const handlePrint = () => {
    window.print();
  };

  const clearAppData = () => {
    if (confirm("DANGER: This will permanently delete ALL accounts and scores for ALL subjects. Continue?")) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 512000) {
        alert("Image too large. Please select a file under 500KB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        try {
          onUpdateUser({ ...user, profileImage: base64String });
        } catch (storageErr) {
          alert("Storage limit reached. Profile image could not be saved.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in duration-500 print:bg-white print:text-black">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-bg-fix { background-color: #f8fafc !important; color: black !important; border: 1px solid #e2e8f0 !important; }
          .print-text-dark { color: #1e293b !important; }
        }
      `}</style>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
        accept="image/*"
      />

      <div className="print-area">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 border-b border-border pb-6 gap-6 print:border-slate-300">
          <div className="flex items-center gap-6">
            <div 
              onClick={triggerImageUpload}
              className="relative w-24 h-24 rounded-2xl bg-secondary border border-border flex items-center justify-center overflow-hidden cursor-pointer group hover:border-primary transition-all shadow-lg"
            >
              {user.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="material-icons-round text-4xl text-muted-foreground group-hover:text-primary transition-colors">add_a_photo</span>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="material-icons-round text-white text-xl">edit</span>
              </div>
            </div>
            
            <div>
              <h2 className="text-4xl font-black text-foreground uppercase italic tracking-tighter print:text-black">
                Neural<span className="text-primary print:text-blue-600">Forge</span>
              </h2>
              <p className="text-muted-foreground font-bold tracking-widest uppercase text-xs mt-1 print:text-slate-600">
                Unified Scholar Profile: {user.email}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 no-print flex-wrap justify-end">
            <Button onClick={onOpenReportCard} variant="primary" size="sm" className="flex items-center gap-2">
              <span className="material-icons-round text-sm">history_edu</span>
              Full Transcript
            </Button>
            <Button onClick={handlePrint} variant="ghost" size="sm" className="flex items-center gap-2">
              <span className="material-icons-round text-sm">picture_as_pdf</span>
              Export PDF
            </Button>
            <Button onClick={onBack} variant="ghost" size="sm">Return</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-card p-6 rounded-2xl border border-border text-center shadow-lg print-bg-fix">
            <span className="text-muted-foreground font-black uppercase text-[10px] tracking-widest block mb-2 print:text-slate-600">Lifetime Assessments</span>
            <span className="text-4xl font-black text-primary print:text-blue-600">{scores.length}</span>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border text-center shadow-lg print-bg-fix">
            <span className="text-muted-foreground font-black uppercase text-[10px] tracking-widest block mb-2 print:text-slate-600">Global Mastery Avg</span>
            <span className="text-4xl font-black text-primary/80 print:text-indigo-600">{avgScore}%</span>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border text-center shadow-lg print-bg-fix">
            <span className="text-muted-foreground font-black uppercase text-[10px] tracking-widest block mb-2 print:text-slate-600">Current Target</span>
            <span className="text-2xl font-black text-foreground truncate block print:text-black">{currentSubject}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-xl print-bg-fix">
               <h3 className="text-sm font-black uppercase text-primary mb-4 flex items-center gap-2 print:text-blue-600">
                 <span className="material-icons-round text-sm">stars</span>
                 Module Proficiency
               </h3>
               <div className="flex flex-col gap-3">
                 {Object.keys(subjectStats).length > 0 ? Object.keys(subjectStats).map(s => {
                   const stats = subjectStats[s];
                   const avg = Math.round(stats.total / stats.count);
                   return (
                     <div key={s} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border/50">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">{s}</span>
                          <span className="text-[8px] text-muted-foreground uppercase tracking-widest">{stats.count} Attempts</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="text-right">
                              <span className="block text-[8px] text-muted-foreground uppercase font-black">Avg</span>
                              <span className={`text-sm font-black ${avg >= 80 ? 'text-green-500' : 'text-foreground'}`}>{avg}%</span>
                           </div>
                           <div className="w-1.5 h-8 bg-border rounded-full overflow-hidden">
                              <div className="w-full bg-primary" style={{ height: `${avg}%`, marginTop: 'auto' }}></div>
                           </div>
                        </div>
                     </div>
                   );
                 }) : (
                   <p className="text-muted-foreground text-xs italic">Complete a module to generate analytics.</p>
                 )}
               </div>
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border shadow-xl print-bg-fix">
               <h3 className="text-sm font-black uppercase text-destructive mb-4 flex items-center gap-2 print:text-red-600 tracking-widest">
                 <span className="material-icons-round text-sm">insights</span>
                 Targeted Learning Gaps: {currentSubject}
               </h3>
               <div className="flex flex-wrap gap-2">
                 {weakTopics.length > 0 ? weakTopics.map((t: string) => (
                   <span key={t} className="px-3 py-1 bg-destructive/10 text-destructive rounded-full text-[10px] font-bold border border-destructive/30 print:bg-red-100 print:text-red-700 print:border-red-300 uppercase tracking-wider">
                     {t}
                   </span>
                 )) : <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest italic">No gaps identified for active module.</p>}
               </div>
               <p className="text-[8px] text-muted-foreground mt-4 leading-tight">Gaps are recalculated after every assessment to ensure precision tracking for the active subject.</p>
            </div>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border shadow-xl overflow-hidden print-bg-fix flex flex-col">
             <div className="mb-4">
                <span className="text-[10px] font-black uppercase text-primary tracking-widest">Global Timeline</span>
             </div>
             <div className="flex-grow min-h-[250px]">
               <ProgressGraph scores={scores.slice(-10)} />
             </div>
          </div>
        </div>

        <div className="bg-card p-8 rounded-2xl border border-border shadow-2xl print-bg-fix mb-8">
          <h3 className="text-xl font-black uppercase mb-6 text-foreground print:text-black tracking-tighter italic">Evaluation History Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left print:text-black">
              <thead>
                <tr className="text-muted-foreground text-[10px] font-black uppercase tracking-widest border-b border-border print:border-slate-300 print:text-slate-600">
                  <th className="pb-4">Timestamp</th>
                  <th className="pb-4">Learning Module</th>
                  <th className="pb-4">Format</th>
                  <th className="pb-4">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border print:divide-slate-200">
                {scores.slice().reverse().map((s, i) => (
                  <tr key={i} className={`text-sm hover:bg-secondary/30 transition-colors ${s.subject === currentSubject ? 'bg-primary/5' : ''}`}>
                    <td className="py-4 text-muted-foreground print:text-slate-500 text-[11px]">{new Date(s.date).toLocaleDateString()}</td>
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold">{s.subject}</span>
                        <span className="text-[8px] text-muted-foreground uppercase tracking-widest">{s.grade}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${s.type === 'quiz' ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary/70'} print:bg-slate-100 print:text-slate-600`}>
                        {s.type}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`font-black ${s.score >= 80 ? 'text-green-500' : s.score >= 50 ? 'text-amber-500' : 'text-destructive'} print:text-black`}>
                        {s.score}%
                      </span>
                    </td>
                  </tr>
                ))}
                {scores.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground font-bold italic">No data records found. Module engagement required.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="no-print bg-destructive/5 border border-destructive/20 rounded-xl p-6 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase text-destructive tracking-widest">Global Reset</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">This clears data for ALL subjects. Proceed with caution.</span>
          </div>
          <Button onClick={clearAppData} variant="secondary" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10 text-[10px] uppercase tracking-widest">
            Reset All History
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;