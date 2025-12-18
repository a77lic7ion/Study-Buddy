import React, { useState, useCallback, useEffect } from 'react';
import { QuizQuestion, IncorrectAnswer, QuestionReview, UserProfile } from '../types';
import { generateQuizQuestions, generateReview } from '../services/geminiService';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { playCorrectSound, playIncorrectSound } from '../utils/soundUtils';

interface QuizProps {
  profile: UserProfile;
  userId: string;
  onBack: () => void;
  onTestComplete: (score: number) => void;
}

const Quiz: React.FC<QuizProps> = ({ profile, userId, onBack, onTestComplete }) => {
  const [status, setStatus] = useState<'loading' | 'active' | 'review' | 'intro'>('intro');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [incorrect, setIncorrect] = useState<IncorrectAnswer[]>([]);
  const [reviews, setReviews] = useState<QuestionReview[]>([]);
  const [focusTopics, setFocusTopics] = useState("");
  const [hasSavedSession, setHasSavedSession] = useState(false);

  const sessionKey = `quiz_session_${userId}_${profile.grade}_${profile.subject}`;

  // Check for saved session on mount
  useEffect(() => {
    const saved = localStorage.getItem(sessionKey);
    if (saved) {
      setHasSavedSession(true);
    }
  }, [sessionKey]);

  const saveProgress = useCallback((updatedIndex: number, updatedScore: number, updatedIncorrect: IncorrectAnswer[], currentQuestions: QuizQuestion[]) => {
    const sessionData = {
      questions: currentQuestions,
      currentIndex: updatedIndex,
      score: updatedScore,
      incorrect: updatedIncorrect,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(sessionKey, JSON.stringify(sessionData));
  }, [sessionKey]);

  const resumeSession = () => {
    const saved = localStorage.getItem(sessionKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setQuestions(data.questions);
        setCurrentIndex(data.currentIndex);
        setScore(data.score);
        setIncorrect(data.incorrect);
        setStatus('active');
      } catch (e) {
        console.error("Failed to resume session", e);
        localStorage.removeItem(sessionKey);
        setHasSavedSession(false);
      }
    }
  };

  const start = async () => {
    setStatus('loading');
    const weakKey = `weakTopics_${userId}_${profile.grade}_${profile.subject}`;
    const weakTopics = JSON.parse(localStorage.getItem(weakKey) || '[]');
    const topicsArray = focusTopics.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    try {
      const qs = await generateQuizQuestions(profile, weakTopics, topicsArray);
      setQuestions(qs);
      setScore(0);
      setCurrentIndex(0);
      setIncorrect([]);
      setSelected(null);
      saveProgress(0, 0, [], qs);
      setStatus('active');
    } catch (e) {
      console.error(e);
      setStatus('intro');
    }
  };

  const handleAnswer = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    const correct = opt === questions[currentIndex].correctAnswer;
    
    let nextScore = score;
    let nextIncorrect = [...incorrect];

    if (correct) {
      nextScore = score + 1;
      setScore(nextScore);
      playCorrectSound();
    } else {
      nextIncorrect = [...incorrect, { question: questions[currentIndex], userAnswer: opt }];
      setIncorrect(nextIncorrect);
      playIncorrectSound();
    }

    saveProgress(currentIndex, nextScore, nextIncorrect, questions);
  };

  const next = async () => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelected(null);
      saveProgress(nextIdx, score, incorrect, questions);
    } else {
      const finalScore = Math.round((score / questions.length) * 100);
      onTestComplete(finalScore);
      
      // Clear session as it is completed
      localStorage.removeItem(sessionKey);

      const weakKey = `weakTopics_${userId}_${profile.grade}_${profile.subject}`;
      const existing = JSON.parse(localStorage.getItem(weakKey) || '[]');
      const newlyWeak = incorrect.map(i => i.question.topic);
      const combined = Array.from(new Set([...existing, ...newlyWeak])).slice(-20);
      localStorage.setItem(weakKey, JSON.stringify(combined));

      if (incorrect.length > 0) {
        setStatus('loading');
        try {
          const feedback = await generateReview(incorrect, profile);
          setReviews(feedback);
        } catch (e) {
          console.error("Failed to generate review", e);
        }
      }
      setStatus('review');
    }
  };

  if (status === 'loading') return <div className="text-center animate-pulse"><LoadingSpinner /><p className="mt-4 font-black uppercase tracking-widest text-cyan-400">AI Tutor is preparing your lesson...</p></div>;

  if (status === 'intro') return (
    <div className="text-center bg-slate-800 p-8 rounded-[2.5rem] border-2 border-slate-700 max-w-lg mx-auto shadow-2xl animate-in zoom-in duration-300">
      <h2 className="text-3xl font-black italic uppercase mb-2 tracking-tighter">Simulation Ready</h2>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6">Target: {profile.subject}</p>
      
      <div className="mb-8 text-left">
        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest ml-2">Focus Topics (Optional)</label>
        <input 
          type="text"
          value={focusTopics}
          onChange={(e) => setFocusTopics(e.target.value)}
          placeholder="e.g. Photosynthesis, Circuits..."
          className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-700"
        />
        <p className="text-[9px] text-slate-600 mt-2 ml-2 italic">Separate topics with commas for best results.</p>
      </div>

      <div className="flex flex-col gap-4">
        <Button onClick={start} size="lg" className="w-full py-5 text-xl shadow-lg bg-cyan-600 hover:bg-cyan-700">Begin Assessment</Button>
        {hasSavedSession && (
          <Button onClick={resumeSession} variant="secondary" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700">Resume Last Session</Button>
        )}
        <Button onClick={onBack} variant="ghost" className="w-full border-slate-700">Abort Mission</Button>
      </div>
    </div>
  );

  if (status === 'review') return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="text-center mb-8 bg-slate-800 p-8 rounded-3xl border-2 border-slate-700 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500"></div>
        <h2 className="text-7xl font-black text-cyan-400 mb-2 drop-shadow-lg">{Math.round((score/questions.length)*100)}%</h2>
        <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px]">Overall Mastery Score</p>
      </div>
      <h3 className="text-xl font-black uppercase text-slate-300 border-l-4 border-cyan-500 pl-4 tracking-widest mb-6">Expert Briefing</h3>
      {reviews.length > 0 ? reviews.map((r, i) => (
        <div key={i} className="bg-slate-800 p-6 rounded-3xl border border-slate-700 animate-in slide-in-from-bottom-6 duration-500" style={{ animationDelay: `${i * 150}ms` }}>
          <p className="font-bold text-lg mb-6 text-white leading-snug">{r.question}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
             <div className="bg-red-950/30 p-4 rounded-2xl border border-red-500/30 shadow-inner">
               <span className="text-[10px] font-black uppercase text-red-400 block mb-2 tracking-widest">Your Result</span>
               <p className="text-red-200 font-black">{r.userAnswer}</p>
             </div>
             <div className="bg-green-950/30 p-4 rounded-2xl border border-green-500/30 shadow-inner">
               <span className="text-[10px] font-black uppercase text-green-400 block mb-2 tracking-widest">Correct Solution</span>
               <p className="text-green-200 font-black">{r.correctAnswer}</p>
             </div>
          </div>
          <div className="bg-slate-900 p-6 rounded-2xl text-sm text-slate-300 border-l-4 border-cyan-500 shadow-2xl leading-relaxed italic">
            <span className="block text-cyan-400 font-black uppercase text-[10px] mb-4 tracking-[0.2em] not-italic">AI Tutor Feedback</span>
            {r.explanation}
          </div>
        </div>
      )) : incorrect.length > 0 && <p className="text-slate-500 italic">Compiling review data...</p>}
      <Button onClick={onBack} size="lg" className="w-full py-6 text-xl mt-12 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/40 shadow-xl">Complete & Sync</Button>
    </div>
  );

  const q = questions[currentIndex];
  return (
    <div className="bg-slate-800 p-8 rounded-[2.5rem] border-2 border-slate-700 w-full max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
      <div className="flex justify-between items-center mb-12">
        <div className="flex flex-col">
          <span className="text-cyan-500 font-black tracking-[0.2em] text-[10px] uppercase mb-1">Assessment In Progress</span>
          <span className="text-white text-2xl font-black italic">{currentIndex+1} <span className="text-slate-600 text-sm font-normal">/ {questions.length}</span></span>
        </div>
        <div className="w-48 bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-700 shadow-inner p-0.5">
          <div className="bg-cyan-500 h-full rounded-full transition-all duration-1000 ease-in-out shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{width: `${((currentIndex+1)/questions.length)*100}%`}}></div>
        </div>
      </div>
      
      <div className="mb-4">
         <span className="text-[10px] font-black uppercase bg-slate-900/50 border border-slate-700 px-4 py-1.5 rounded-full text-slate-400 tracking-widest inline-block">{q.topic}</span>
      </div>
      <h3 className="text-2xl md:text-3xl font-black mb-12 text-white leading-tight drop-shadow-sm">{q.question}</h3>
      
      <div className="grid grid-cols-1 gap-4 mb-12">
        {q.options.map(opt => {
          const isSelected = selected === opt;
          const isCorrect = opt === q.correctAnswer;
          let color = 'bg-slate-900/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800 transition-all';
          
          if (selected) {
            if (isCorrect) {
              color = 'bg-green-600 border-green-400 text-white shadow-xl shadow-green-900/40 scale-[1.03] z-10';
            } else if (isSelected) {
              color = 'bg-red-600 border-red-400 text-white shadow-xl shadow-red-900/40';
            } else {
              color = 'bg-slate-900/20 border-slate-800 opacity-30';
            }
          }
          
          return (
            <button 
              key={opt} 
              onClick={() => handleAnswer(opt)} 
              disabled={!!selected}
              className={`p-6 rounded-[1.25rem] border-2 text-left transition-all duration-300 font-bold group relative overflow-hidden ${color}`}
            >
              <div className="relative z-10 flex justify-between items-center">
                <span className="flex-1 pr-4">{opt}</span>
                {selected && isCorrect && (
                  <div className="bg-white/20 p-1.5 rounded-full animate-in zoom-in duration-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {selected && isSelected && !isCorrect && (
                  <div className="bg-white/20 p-1.5 rounded-full animate-in zoom-in duration-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className={`mb-8 p-5 rounded-2xl border-2 text-center font-black uppercase tracking-[0.3em] shadow-inner text-xs ${selected === q.correctAnswer ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
             {selected === q.correctAnswer ? 'Success Identified' : 'Inaccuracy Detected'}
          </div>
          <Button onClick={next} className="w-full py-6 text-xl shadow-2xl bg-cyan-600 hover:bg-cyan-700">
            {currentIndex === questions.length - 1 ? 'End Assessment' : 'Proceed to Next'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Quiz;