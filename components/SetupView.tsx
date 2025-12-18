import React, { useState } from 'react';
import { UserProfile } from '../types';
import { DEFAULT_GRADES, POPULAR_SUBJECTS } from '../constants';
import Button from './Button';

interface SetupViewProps {
  onComplete: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
}

const SetupView: React.FC<SetupViewProps> = ({ onComplete, initialProfile }) => {
  const [grade, setGrade] = useState(initialProfile?.grade || DEFAULT_GRADES[6]); // Default to Grade 7 per image
  const [subject, setSubject] = useState(initialProfile?.subject || "");
  const [customSubject, setCustomSubject] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = subject === "CUSTOM" ? customSubject : subject;
    if (finalSubject.trim()) {
      onComplete({ grade, subject: finalSubject });
    }
  };

  return (
    <div className="max-w-2xl w-full mx-auto bg-[#02040a] border border-white/5 p-8 sm:p-12 rounded-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col items-center mb-12">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-8 text-primary ring-1 ring-primary/20 shadow-[0_0_20px_rgba(79,70,229,0.1)]">
          <span className="material-icons-round text-4xl">rocket_launch</span>
        </div>
        <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter text-center">
          INITIALIZE <span className="text-primary italic">TARGET</span>
        </h2>
        <p className="text-muted-foreground font-medium text-center mt-3 tracking-wide opacity-70">
          Configure subject parameters for AI synthesis.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="space-y-4">
          <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
            ACADEMIC GRADE
          </label>
          <div className="relative group">
            <select 
              value={grade} 
              onChange={(e) => setGrade(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:ring-1 focus:ring-primary focus:border-primary/50 outline-none appearance-none cursor-pointer transition-all pr-12 group-hover:border-white/20"
            >
              {DEFAULT_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
              <span className="material-icons-round">expand_more</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
            LEARNING MODULE
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {POPULAR_SUBJECTS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => {setSubject(s); setCustomSubject("");}}
                className={`p-4 text-[9px] font-black uppercase rounded-xl border transition-all duration-300 ${
                  subject === s 
                    ? 'bg-primary border-primary text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] scale-[1.02]' 
                    : 'bg-black/40 border-white/10 text-muted-foreground hover:border-white/30 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSubject("CUSTOM")}
              className={`p-4 text-[9px] font-black uppercase rounded-xl border transition-all duration-300 ${
                subject === "CUSTOM" 
                  ? 'bg-primary border-primary text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] scale-[1.02]' 
                  : 'bg-black/40 border-white/10 text-muted-foreground hover:border-white/30 hover:text-white'
              }`}
            >
              CUSTOM
            </button>
          </div>
          
          {subject === "CUSTOM" && (
            <div className="animate-in slide-in-from-top-2 duration-300 mt-4">
              <input
                type="text"
                placeholder="SPECIFY CUSTOM MODULE..."
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl p-5 text-xs font-bold text-white uppercase tracking-widest placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary outline-none transition-all"
                required
              />
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={!subject || (subject === "CUSTOM" && !customSubject)}
          className="w-full bg-primary text-white text-sm font-black uppercase tracking-[0.2em] py-6 rounded-2xl shadow-[0_8px_30px_rgba(79,70,229,0.3)] hover:shadow-[0_8px_40px_rgba(79,70,229,0.5)] hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          SYNC DATA & START
        </button>
      </form>
    </div>
  );
};

export default SetupView;