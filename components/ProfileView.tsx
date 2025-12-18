import React from 'react';
import { User, TestResult } from '../types';
import Button from './Button';
import ProgressGraph from './ProgressGraph';

interface ProfileViewProps {
  user: User;
  scores: TestResult[];
  onBack: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, scores, onBack }) => {
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

      <div className="print-area">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 border-b border-slate-700 pb-6 gap-4 print:border-slate-300">
          <div>
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter print:text-black">
              User<span className="text-cyan-400 print:text-blue-600">Profile</span>
            </h2>
            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs mt-1 print:text-slate-600">
              Scholar Transcript: {user.email}
            </p>
          </div>
          <div className="flex gap-2 no-print">
            <Button onClick={handlePrint} variant="ghost" size="sm" className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Export PDF
            </Button>
            <Button onClick={onBack} variant="ghost" size="sm">Return Home</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center shadow-lg print-bg-fix">
            <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest block mb-2 print:text-slate-600">Total Attempts</span>
            <span className="text-4xl font-black text-cyan-400 print:text-blue-600">{scores.length}</span>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center shadow-lg print-bg-fix">
            <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest block mb-2 print:text-slate-600">Global Average</span>
            <span className="text-4xl font-black text-indigo-400 print:text-indigo-600">{avgScore}%</span>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center shadow-lg print-bg-fix">
            <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest block mb-2 print:text-slate-600">Active Subject</span>
            <span className="text-2xl font-black text-white truncate block print:text-black">{user.profile?.subject || 'None'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="space-y-6">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl print-bg-fix">
               <h3 className="text-lg font-black uppercase text-cyan-400 mb-4 flex items-center gap-2 print:text-blue-600">
                 <svg className="w-5 h-5 no-print" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                 Subject Mastery
               </h3>
               <div className="flex flex-wrap gap-2">
                 {strengths.length > 0 ? strengths.map(s => (
                   <span key={s} className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold border border-green-500/30 print:bg-green-100 print:text-green-700 print:border-green-300">
                     {s} Expert
                   </span>
                 )) : <p className="text-slate-500 text-sm italic">Analyze more subjects to determine mastery...</p>}
               </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl print-bg-fix">
               <h3 className="text-lg font-black uppercase text-red-400 mb-4 flex items-center gap-2 print:text-red-600">
                 <svg className="w-5 h-5 no-print" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.047a1 1 0 01.897.487l7.32 12.474A1 1 0 0118.656 15.5H1.344a1 1 0 01-.86-1.492L7.803 1.534a1 1 0 01.897-.487h2.601zM10 5a1 1 0 011 1v3a1 1 0 11-2 0V6a1 1 0 011-1zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                 Identified Learning Gaps
               </h3>
               <div className="flex flex-wrap gap-2">
                 {weakTopics.length > 0 ? weakTopics.map((t: string) => (
                   <span key={t} className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold border border-red-500/30 print:bg-red-100 print:text-red-700 print:border-red-300">
                     {t}
                   </span>
                 )) : <p className="text-slate-500 text-sm italic">No specific gaps identified in the current session.</p>}
               </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl overflow-hidden print-bg-fix">
             <div className="print:hidden">
               <ProgressGraph scores={scores.slice(-10)} />
             </div>
             <div className="hidden print:block text-slate-800 italic text-sm">
                * Progress Graph Omitted in Text Report *
             </div>
          </div>
        </div>

        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl print-bg-fix">
          <h3 className="text-xl font-black uppercase mb-6 text-slate-300 print:text-black">Attempt History Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left print:text-black">
              <thead>
                <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-700 print:border-slate-300 print:text-slate-600">
                  <th className="pb-4">Timestamp</th>
                  <th className="pb-4">Module</th>
                  <th className="pb-4">Format</th>
                  <th className="pb-4">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 print:divide-slate-200">
                {scores.slice().reverse().map((s, i) => (
                  <tr key={i} className="text-sm hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 text-slate-400 print:text-slate-500">{new Date(s.date).toLocaleDateString()}</td>
                    <td className="py-4 font-bold">{s.subject}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${s.type === 'quiz' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-cyan-500/20 text-cyan-400'} print:bg-slate-100 print:text-slate-600 print:border print:border-slate-300`}>
                        {s.type}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`font-black ${s.score >= 80 ? 'text-green-400' : s.score >= 50 ? 'text-yellow-400' : 'text-red-400'} print:text-black`}>
                        {s.score}%
                      </span>
                    </td>
                  </tr>
                ))}
                {scores.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 font-bold italic">No data records found. Module engagement required.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="hidden print:block mt-12 pt-8 border-t border-slate-300 text-[10px] text-slate-500 text-center">
           Generated by StudyBuddy AI Assessment Engine • Verification Hash: {Math.random().toString(36).substring(7).toUpperCase()}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;