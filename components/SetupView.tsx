import React, { useState } from 'react';
import { UserProfile } from '../types';
import { DEFAULT_GRADES, POPULAR_SUBJECTS } from '../constants';
import Button from './Button';

interface SetupViewProps {
  onComplete: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
}

const SetupView: React.FC<SetupViewProps> = ({ onComplete, initialProfile }) => {
  const [grade, setGrade] = useState(initialProfile?.grade || DEFAULT_GRADES[2]); // Default Grade 6
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
    <div className="max-w-md mx-auto bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom duration-500">
      <h2 className="text-3xl font-bold text-cyan-400 mb-6 text-center">Set Your Goal</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Select Your Grade</label>
          <select 
            value={grade} 
            onChange={(e) => setGrade(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          >
            {DEFAULT_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Choose a Subject</label>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {POPULAR_SUBJECTS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => {setSubject(s); setCustomSubject("");}}
                className={`p-2 text-sm rounded-md border transition-all ${subject === s ? 'bg-cyan-600 border-cyan-400' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}
              >
                {s}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSubject("Other")}
              className={`p-2 text-sm rounded-md border transition-all ${subject === "Other" ? 'bg-cyan-600 border-cyan-400' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}
            >
              Other...
            </button>
          </div>
          
          {subject === "Other" && (
            <input
              type="text"
              placeholder="Enter subject name (e.g. Art History)"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              required
            />
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={!subject || (subject === "Other" && !customSubject)}>
          Start Learning
        </Button>
      </form>
    </div>
  );
};

export default SetupView;