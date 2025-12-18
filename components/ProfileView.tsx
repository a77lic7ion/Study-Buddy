
import React, { useRef, useMemo } from 'react';
import { User, TestResult } from '../types';
import Button from './Button';
import ProgressGraph from './ProgressGraph';

interface ProfileViewProps {
  user: User;
  scores: TestResult[];
  onBack: () => void;
  onUpdateUser: (updatedUser: User) => void;
  onOpenReportCard: () => void;
  onStartRemediation: (type: 'quiz' | 'flashcards') => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, scores, onBack, onUpdateUser, onOpenReportCard, onStartRemediation }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subjectStats = useMemo(() => scores.reduce((acc: any, curr) => {
    if (!acc[curr.subject]) acc[curr.subject] = { total: 0, count: 0, best: 0 };
    acc[curr.subject].total += curr.score;
    acc[curr.subject].count += 1;
    acc[curr.subject].best = Math.max(acc[curr.subject].best, curr.score);
    return acc;
  }, {}), [scores]);

  const currentSubject = user.profile?.subject || 'None';
  
  const gapAnalysis = useMemo(() => {
    const weakKey = `weakTopics_${user.id}_${user.profile?.grade}_${currentSubject}`;
    const rawWeakTopics: string[] = JSON.parse(localStorage.getItem(weakKey) || '[]');
    
    const counts: Record<string, number> = {};
    rawWeakTopics.forEach(topic => {
      counts[topic] = (counts[topic] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [user.id, user.profile?.grade, currentSubject]);

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

  const maxGapCount = gapAnalysis.length > 0 ? Math.max(...gapAnalysis.map(g => g.count)) : 1;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 sm:py-8 animate-in fade-in duration-700 print:bg-white print:text-black">
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

      <div className="print-area space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div 
              onClick={triggerImageUpload}
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-secondary border border-border flex items-center justify-center overflow-hidden cursor-pointer group shadow-2xl ring-1 ring-primary/20 flex-shrink-0"
            >
              {user.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center opacity-30 group-hover:opacity-100 transition-opacity">
                   <span className="material-icons-round text-3xl">account_circle</span>
                   <span className="text-[8px] font-black uppercase tracking-tighter mt-1">Upload</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="material-icons-round text-white">camera_alt</span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl sm:text-4xl font-black text-foreground uppercase italic tracking-tighter leading-none">
                NEURAL<span className="text-primary italic">FORGE</span>
              </h2>
              <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                UNIFIED PROFILE: {user.email.split('@')[0].toUpperCase()}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 no-print">
            <Button onClick={onOpenReportCard} variant="primary" size="sm" className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/20 px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[9px] sm:text-[10px] tracking-[0.2em] font-black uppercase italic flex-grow md:flex-grow-0">
              Full Transcript
            </Button>
            <Button onClick={handlePrint} variant="ghost" size="sm" className="bg-secondary/50 border-border px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[9px] sm:text-[10px] tracking-[0.2em] font-black uppercase flex-grow md:flex-grow-0">
              PDF
            </Button>
            <Button onClick={onBack} variant="ghost" size="sm" className="bg-secondary/50 border-border px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[9px] sm:text-[10px] tracking-[0.2em] font-black uppercase flex-grow md:flex-grow-0">
              Back
            </Button>
          </div>
        </div>

        {/* Top Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-card/40 backdrop-blur-xl border border-white/5 p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] text-center shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><span className="material-icons-round text-5xl sm:text-6xl text-primary">analytics</span></div>
            <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-4 block leading-none">Assessments</span>
            <span className="text-5xl sm:text-7xl font-black text-primary drop-shadow-[0_0_20px_rgba(79,70,229,0.4)] leading-none">{scores.length}</span>
          </div>
          <div className="bg-card/40 backdrop-blur-xl border border-white/5 p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] text-center shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><span className="material-icons-round text-5xl sm:text-6xl text-primary">emoji_events</span></div>
            <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-4 block leading-none">Global Mastery</span>
            <span className="text-5xl sm:text-7xl font-black text-primary drop-shadow-[0_0_20px_rgba(79,70,229,0.4)] leading-none">{avgScore}%</span>
          </div>
          <div className="bg-card/40 backdrop-blur-xl border border-white/5 p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] text-center shadow-2xl relative overflow-hidden group sm:col-span-2 md:col-span-1">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><span className="material-icons-round text-5xl sm:text-6xl text-primary">target</span></div>
            <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-4 block leading-none">Target Module</span>
            <span className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground italic uppercase tracking-tighter truncate max-w-full leading-none mt-2">{currentSubject}</span>
          </div>
        </div>

        {/* Remediation Protocol Section */}
        {gapAnalysis.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 no-print animate-in zoom-in duration-500">
            <div className="flex items-center gap-4 sm:gap-6 text-center lg:text-left flex-col sm:flex-row lg:flex-row">
               <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-lg flex-shrink-0">
                 <span className="material-icons-round text-3xl sm:text-4xl animate-pulse">healing</span>
               </div>
               <div>
                  <h3 className="text-lg sm:text-xl font-black uppercase italic tracking-tighter italic">Remediation Protocol</h3>
                  <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] sm:tracking-[0.2em] mt-1 max-w-sm">
                    Initiate targeted neural restoration. AI will synthesize <span className="text-primary italic">reworded</span> assessments to bypass rote memorization.
                  </p>
               </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
               <Button onClick={() => onStartRemediation('flashcards')} variant="primary" className="text-[8px] sm:text-[9px] uppercase tracking-widest px-4 sm:px-6 bg-primary/20 border-primary/30 text-primary hover:bg-primary/40 py-3 sm:py-4 flex-grow">Restoration Deck</Button>
               <Button onClick={() => onStartRemediation('quiz')} variant="primary" className="text-[8px] sm:text-[9px] uppercase tracking-widest px-4 sm:px-6 shadow-lg shadow-primary/20 py-3 sm:py-4 flex-grow">Simulated Lab</Button>
            </div>
          </div>
        )}

        {/* Mid Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Module Proficiency List */}
            <div className="bg-card/30 backdrop-blur-xl p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 shadow-2xl">
               <h3 className="text-[10px] sm:text-[11px] font-black uppercase text-primary mb-8 sm:mb-10 flex items-center gap-3 tracking-[0.3em] sm:tracking-[0.4em]">
                 <span className="material-icons-round text-lg">star_outline</span>
                 Proficiency Index
               </h3>
               <div className="space-y-4 sm:space-y-6">
                 {Object.keys(subjectStats).length > 0 ? Object.keys(subjectStats).map(s => {
                   const stats = subjectStats[s];
                   const avg = Math.round(stats.total / stats.count);
                   return (
                     <div key={s} className="bg-secondary/10 p-4 sm:p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-primary/5 transition-all cursor-default">
                        <div className="flex flex-col pr-4">
                          <span className="text-sm sm:text-base font-black uppercase italic tracking-tight italic truncate max-w-[120px] xs:max-w-none">{s}</span>
                          <span className="text-[8px] sm:text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1">{stats.count} CYCLES</span>
                        </div>
                        <div className="flex items-center gap-4 sm:gap-8 flex-shrink-0">
                           <div className="text-right">
                              <span className="block text-[8px] text-muted-foreground uppercase font-black tracking-widest mb-1 opacity-50">AVG</span>
                              <span className={`text-xl sm:text-2xl font-black italic ${avg >= 80 ? 'text-green-500' : 'text-foreground'}`}>{avg}%</span>
                           </div>
                           <div className="w-1.5 h-10 sm:h-14 bg-white/5 rounded-full overflow-hidden relative">
                              <div className="absolute bottom-0 left-0 w-full bg-primary shadow-[0_0_15px_rgba(79,70,229,0.9)] transition-all duration-1000" style={{ height: `${avg}%` }}></div>
                           </div>
                        </div>
                     </div>
                   );
                 }) : (
                   <div className="py-12 text-center opacity-30 flex flex-col items-center">
                     <span className="material-icons-round text-4xl mb-4">folder_off</span>
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">No neural data sync'd.</p>
                   </div>
                 )}
               </div>
            </div>

            {/* Targeted Learning Gaps Visualization */}
            <div className="bg-card/30 backdrop-blur-xl p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5"><span className="material-icons-round text-7xl text-destructive">error_outline</span></div>
               <h3 className="text-[10px] sm:text-[11px] font-black uppercase text-destructive mb-8 sm:mb-10 flex items-center gap-3 tracking-[0.3em] sm:tracking-[0.4em]">
                 <span className="material-icons-round text-lg">dangerous</span>
                 Neural Gap Analysis
               </h3>
               
               <div className="space-y-6">
                 {gapAnalysis.length > 0 ? gapAnalysis.map((gap, i) => (
                   <div key={gap.topic} className="space-y-2">
                     <div className="flex justify-between items-end gap-2">
                       <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-foreground/80 truncate">{gap.topic}</span>
                       <span className="text-[8px] sm:text-[9px] font-bold text-destructive uppercase tracking-widest flex-shrink-0">{gap.count} FAILURES</span>
                     </div>
                     <div className="w-full h-2 sm:h-2.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-destructive shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all duration-1000" 
                          style={{ 
                            width: `${(gap.count / maxGapCount) * 100}%`,
                            animationDelay: `${i * 100}ms`
                          }}
                        ></div>
                     </div>
                   </div>
                 )) : (
                   <div className="py-8 bg-green-500/5 border border-green-500/10 rounded-2xl p-6 text-center flex flex-col items-center">
                      <span className="material-icons-round text-green-500 text-3xl mb-4 animate-bounce">verified</span>
                      <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-green-500 leading-relaxed italic">
                        No critical learning gaps identified.<br/>
                        Neural integrity confirmed.
                      </p>
                   </div>
                 )}
               </div>
            </div>
          </div>

          <div className="bg-card/30 backdrop-blur-xl p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 shadow-2xl flex flex-col h-fit">
             <div className="h-[300px] sm:h-[400px]">
                <ProgressGraph scores={scores.slice(-10)} />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
