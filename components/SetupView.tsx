import React, { useState } from 'react';
import { UserProfile } from '../types';
import { DEFAULT_GRADES, POPULAR_SUBJECTS } from '../constants';
import Button from './Button';

interface SetupViewProps {
  onComplete: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
}

const SetupView: React.FC<SetupViewProps> = ({ onComplete, initialProfile }) => {
  const [grade, setGrade] = useState(initialProfile?.grade || DEFAULT_GRADES[5]);
  const [subject, setSubject] = useState(initialProfile?.subject || "");
  const [customSubject, setCustomSubject] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = subject === "Other" ? customSubject : subject;
    if (finalSubject.trim()) {
      onComplete({ grade, subject: finalSubject });
    }
  };

  return (
    <div className="max-w-xl w-full mx-auto bg-card border border-border p-10 rounded-lg shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
      <div className="flex flex-col items-center mb-10">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary ring-1 ring-primary/20">
          <span className="material-icons-round text-2xl">rocket_launch</span>
        </div>
        <h2 className="text-2xl font-black text-foreground uppercase italic tracking-tighter">Initialize <span className="text-primary">Target</span></h2>
        <p className="text-sm text-muted-foreground font-medium text-center">Configure subject parameters for AI synthesis.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-3">
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Academic Grade</label>
          <select 
            value={grade} 
            onChange={(e) => setGrade(e.target.value)}
            className="w-full bg-background border border-border rounded-lg p-3 text-sm font-bold text-foreground focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer"
          >
            {DEFAULT_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Learning Module</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {POPULAR_SUBJECTS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => {setSubject(s); setCustomSubject("");}}
                className={`p-3 text-[10px] font-black uppercase rounded-lg border transition-all ${subject === s ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-background border-border text-muted-foreground hover:border-primary/40'}`}
              >
                {s}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSubject("Other")}
              className={`p-3 text-[10px] font-black uppercase rounded-lg border transition-all ${subject === "Other" ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-background border-border text-muted-foreground hover:border-primary/40'}`}
            >
              Custom
            </button>
          </div>
          
          {subject === "Other" && (
            <input
              type="text"
              placeholder="Enter subject name..."
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              className="w-full bg-background border border-border rounded-lg p-4 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
              required
            />
          )}
        </div>

        <Button type="submit" size="lg" className="w-full uppercase tracking-widest py-5" disabled={!subject || (subject === "Other" && !customSubject)}>
          SYNC DATA & START
        </Button>
      </form>
    </div>
  );
};

export default SetupView;