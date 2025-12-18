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

  // Logic to calculate strengths and weaknesses
  const subjectAverages = scores.reduce((acc: any, curr) => {
    if (!acc[curr.subject]) acc[curr.subject] = { total: 0, count: 0 };
    acc[curr.subject].total += curr.score;
    acc[curr.subject].count += 1;
    return acc;
  }, {});

  const strengths = Object.keys(subjectAverages)
    .filter(subj => (subjectAverages[subj].total / subjectAverages[subj].count) >= 80);

  // Get weak topics from local storage
  const weakKey = `weakTopics_${user.id}_${user.profile?.grade}_${user.profile?.subject}`;
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
                Scholar Transcript: {user.email}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 no-print flex-wrap justify-end">
            <Button onClick={onOpenReportCard} variant="primary" size="sm" className="flex items-center gap-2">
              <span className="material-icons-round text-sm">history_edu</span>
              View Report Card
            </Button>
            <Button onClick={handlePrint} variant="ghost" size="sm" className="flex items-center gap-2">
              <span className="material-icons-round text-sm">picture_as_pdf</span>
              Export PDF
            </Button>
            <Button onClick={onBack} variant="ghost" size="sm">Return Home</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-card p-6 rounded-2xl border border-border text-center shadow-lg print-bg-fix">
            <span className="text-muted-foreground font-black uppercase text-[10px] tracking-widest block mb-2 print:text-slate-600">Total Attempts</span>
            <span className="text-4xl font-black text-primary print:text-blue-600">{scores.length}</span>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border text-center shadow-lg print-bg-fix">
            <span className="text-muted-foreground font-black uppercase text-[10px] tracking-widest block mb-2 print:text-slate-600">Global Average</span>
            <span className="text-4xl font-black text-primary/80 print:text-indigo-600">{avgScore}%</span>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border text-center shadow-lg print-bg-fix">
            <span className="text-muted-foreground font-black uppercase text-[10px] tracking-widest block mb-2 print:text-slate-600">Active Subject</span>
            <span className="text-2xl font-black text-foreground truncate block print:text-black">{user.profile?.subject || 'None'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-xl print-bg-fix">
               <h3 className="text-lg font-black uppercase text-primary mb-4 flex items-center gap-2 print:text-blue-600">
                 <span className="material-icons-round text-sm">military_tech</span>
                 Subject Mastery
               </h3>
               <div className="flex flex-wrap gap-2">
                 {strengths.length > 0 ? strengths.map(s => (
                   <span key={s} className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-bold border border-green-500/30 print:bg-green-100 print:text-green-700 print:border-green-300 uppercase tracking-wider">
                     {s} Expert
                   </span>
                 )) : <p className="text-muted-foreground text-sm italic">Analyze more subjects to determine mastery...</p>}
               </div>
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border shadow-xl print-bg-fix">
               <h3 className="text-lg font-black uppercase text-destructive mb-4 flex items-center gap-2 print:text-red-600">
                 <span className="material-icons-round text-sm">warning</span>
                 Identified Learning Gaps
               </h3>
               <div className="flex flex-wrap gap-2">
                 {weakTopics.length > 0 ? weakTopics.map((t: string) => (
                   <span key={t} className="px-3 py-1 bg-destructive/10 text-destructive rounded-full text-[10px] font-bold border border-destructive/30 print:bg-red-100 print:text-red-700 print:border-red-300 uppercase tracking-wider">
                     {t}
                   </span>
                 )) : <p className="text-muted-foreground text-sm italic">No specific gaps identified in the current session.</p>}
               </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border shadow-xl overflow-hidden print-bg-fix">
             <div className="print:hidden">
               <ProgressGraph scores={scores.slice(-10)} />
             </div>
             <div className="hidden print:block text-muted-foreground italic text-sm">
                * Progress Graph Omitted in Text Report *
             </div>
          </div>
        </div>

        <div className="bg-card p-8 rounded-2xl border border-border shadow-2xl print-bg-fix">
          <h3 className="text-xl font-black uppercase mb-6 text-foreground print:text-black">Attempt History Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left print:text-black">
              <thead>
                <tr className="text-muted-foreground text-[10px] font-black uppercase tracking-widest border-b border-border print:border-slate-300 print:text-slate-600">
                  <th className="pb-4">Timestamp</th>
                  <th className="pb-4">Module</th>
                  <th className="pb-4">Format</th>
                  <th className="pb-4">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border print:divide-slate-200">
                {scores.slice().reverse().map((s, i) => (
                  <tr key={i} className="text-sm hover:bg-secondary/30 transition-colors">
                    <td className="py-4 text-muted-foreground print:text-slate-500">{new Date(s.date).toLocaleDateString()}</td>
                    <td className="py-4 font-bold">{s.subject}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${s.type === 'quiz' ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary/70'} print:bg-slate-100 print:text-slate-600 print:border print:border-slate-300`}>
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
        
        <div className="hidden print:block mt-12 pt-8 border-t border-border text-[10px] text-muted-foreground text-center uppercase tracking-widest">
           Generated by NeuroForge Adaptive Intelligence Engine • Verification Hash: {Math.random().toString(36).substring(7).toUpperCase()}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;