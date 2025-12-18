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
  
  // Gaps are subject-specific
  const weakKey = `weakTopics_${user.id}_${user.profile?.grade}_${currentSubject}`;
  const weakTopics = JSON.parse(localStorage.getItem(weakKey) || '[]');

  const avgScore = scores.length > 0 
    ? Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length) 
    : 0;

  const handlePrint = () => {
    window.print();
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
        onUpdateUser({ ...user, profileImage: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-700 print:bg-white print:text-black">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
        accept="image/*"
      />

      <div className="print-area space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
          <div className="flex items-center gap-4">
            <div 
              onClick={triggerImageUpload}
              className="relative w-16 h-16 rounded-xl bg-secondary border border-border flex items-center justify-center overflow-hidden cursor-pointer group shadow-lg"
            >
              {user.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <img src="/logo.png" alt="NeuroForge" className="w-10 h-10 object-contain opacity-50 group-hover:opacity-100 transition-opacity" />
              )}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="material-icons-round text-white text-sm">edit</span>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black text-foreground uppercase italic tracking-tighter">
                NEURAL<span className="text-primary">FORGE</span>
              </h2>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                UNIFIED SCHOLAR PROFILE: {user.email.toUpperCase()}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 no-print">
            <Button onClick={onOpenReportCard} variant="primary" size="sm" className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/20 px-6 py-2 rounded-lg text-[10px] tracking-widest uppercase">
              <span className="material-icons-round text-sm mr-2">history_edu</span>
              Full Transcript
            </Button>
            <Button onClick={handlePrint} variant="ghost" size="sm" className="bg-secondary border-border px-6 py-2 rounded-lg text-[10px] tracking-widest uppercase">
              <span className="material-icons-round text-sm mr-2">picture_as_pdf</span>
              Export PDF
            </Button>
            <Button onClick={onBack} variant="ghost" size="sm" className="bg-secondary border-border px-6 py-2 rounded-lg text-[10px] tracking-widest uppercase">
              Return
            </Button>
          </div>
        </div>

        {/* Top Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card/30 backdrop-blur-sm border border-border p-8 rounded-2xl text-center shadow-xl flex flex-col items-center justify-center">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-4">Lifetime Assessments</span>
            <span className="text-6xl font-black text-primary drop-shadow-[0_0_15px_rgba(79,70,229,0.3)]">{scores.length}</span>
          </div>
          <div className="bg-card/30 backdrop-blur-sm border border-border p-8 rounded-2xl text-center shadow-xl flex flex-col items-center justify-center">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-4">Global Mastery Avg</span>
            <span className="text-6xl font-black text-primary/80 drop-shadow-[0_0_15px_rgba(79,70,229,0.2)]">{avgScore}%</span>
          </div>
          <div className="bg-card/30 backdrop-blur-sm border border-border p-8 rounded-2xl text-center shadow-xl flex flex-col items-center justify-center">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-4">Current Target</span>
            <span className="text-4xl font-black text-foreground truncate max-w-full">{currentSubject}</span>
          </div>
        </div>

        {/* Mid Section: Proficiency & Growth */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-card/20 backdrop-blur-sm p-8 rounded-2xl border border-border shadow-xl h-full">
               <h3 className="text-xs font-black uppercase text-primary mb-8 flex items-center gap-2 tracking-[0.3em]">
                 <span className="material-icons-round text-sm">stars</span>
                 Module Proficiency
               </h3>
               <div className="space-y-4">
                 {Object.keys(subjectStats).length > 0 ? Object.keys(subjectStats).map(s => {
                   const stats = subjectStats[s];
                   const avg = Math.round(stats.total / stats.count);
                   return (
                     <div key={s} className="bg-secondary/20 p-6 rounded-xl border border-border/50 flex items-center justify-between group hover:bg-secondary/40 transition-all">
                        <div className="flex flex-col">
                          <span className="text-sm font-black uppercase italic">{s}</span>
                          <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">{stats.count} Attempts</span>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="text-right">
                              <span className="block text-[8px] text-muted-foreground uppercase font-black tracking-widest mb-1">Avg</span>
                              <span className={`text-base font-black ${avg >= 80 ? 'text-green-500' : 'text-foreground'}`}>{avg}%</span>
                           </div>
                           <div className="w-1 h-12 bg-border rounded-full overflow-hidden relative">
                              <div className="absolute bottom-0 left-0 w-full bg-primary shadow-[0_0_8px_rgba(79,70,229,0.8)]" style={{ height: `${avg}%` }}></div>
                           </div>
                        </div>
                     </div>
                   );
                 }) : (
                   <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest italic py-8 text-center opacity-30">Awaiting proficiency data...</p>
                 )}
               </div>
            </div>

            <div className="bg-card/20 backdrop-blur-sm p-8 rounded-2xl border border-border shadow-xl">
               <h3 className="text-xs font-black uppercase text-destructive mb-6 flex items-center gap-2 tracking-[0.3em]">
                 <span className="material-icons-round text-sm">insights</span>
                 Targeted Learning Gaps: {currentSubject}
               </h3>
               <div className="flex flex-wrap gap-2 mb-6">
                 {weakTopics.length > 0 ? weakTopics.map((t: string) => (
                   <span key={t} className="px-4 py-2 bg-destructive/5 text-destructive border border-destructive/20 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                     {t}
                   </span>
                 )) : <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest italic opacity-40">No critical gaps identified for active module.</p>}
               </div>
               <p className="text-[8px] text-muted-foreground font-medium leading-relaxed uppercase tracking-wider opacity-60">
                 Gaps are recalculated after every assessment to ensure precision tracking for the active subject. 
                 Mastery of these items is required for module certification.
               </p>
            </div>
          </div>

          <div className="bg-card/20 backdrop-blur-sm p-8 rounded-2xl border border-border shadow-xl flex flex-col h-full">
             <ProgressGraph scores={scores.slice(-10)} />
          </div>
        </div>

        {/* Bottom Section: History Log */}
        <div className="bg-card/20 backdrop-blur-sm p-10 rounded-2xl border border-border shadow-2xl">
          <h3 className="text-sm font-black uppercase mb-8 text-foreground tracking-[0.3em] flex items-center gap-2">
            <span className="material-icons-round text-sm text-primary">analytics</span>
            Evaluation History Log
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] border-b border-border/50">
                  <th className="pb-6 px-4">Timestamp</th>
                  <th className="pb-6 px-4">Learning Module</th>
                  <th className="pb-6 px-4">Format</th>
                  <th className="pb-6 px-4 text-right">Efficiency Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {scores.slice().reverse().map((s, i) => (
                  <tr key={i} className={`group hover:bg-primary/5 transition-all ${s.subject === currentSubject ? 'bg-primary/5' : ''}`}>
                    <td className="py-6 px-4">
                      <span className="text-[10px] font-bold text-muted-foreground font-mono">
                        {new Date(s.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-6 px-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black italic uppercase group-hover:text-primary transition-colors">{s.subject}</span>
                        <span className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-50">{s.grade}</span>
                      </div>
                    </td>
                    <td className="py-6 px-4">
                      <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${s.type === 'quiz' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-secondary border-border text-muted-foreground'}`}>
                        {s.type}
                      </span>
                    </td>
                    <td className="py-6 px-4 text-right">
                      <span className={`text-lg font-black italic ${s.score >= 80 ? 'text-green-500' : s.score >= 50 ? 'text-amber-500' : 'text-destructive'} drop-shadow-sm`}>
                        {s.score}%
                      </span>
                    </td>
                  </tr>
                ))}
                {scores.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-muted-foreground text-[10px] font-black uppercase tracking-[0.4em] opacity-20">
                      No neural data records identified.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;