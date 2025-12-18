
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
  isRemediation?: boolean;
}

type QuestionCount = 10 | 25 | 30;

const Quiz: React.FC<QuizProps> = ({ profile, userId, onBack, onTestComplete, isRemediation = false }) => {
  const [status, setStatus] = useState<'loading' | 'active' | 'review' | 'intro'>(isRemediation ? 'loading' : 'intro');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [questionCount, setQuestionCount] = useState<QuestionCount>(10);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [incorrect, setIncorrect] = useState<IncorrectAnswer[]>([]);
  const [reviews, setReviews] = useState<QuestionReview[]>([]);
  const [focusTopics, setFocusTopics] = useState("");
  const [weakTopics, setWeakTopics] = useState<string[]>([]);

  const sessionKey = `quiz_session_${userId}_${profile.grade}_${profile.subject}`;
  const weakKey = `weakTopics_${userId}_${profile.grade}_${profile.subject}`;

  useEffect(() => {
    const storedWeak = localStorage.getItem(weakKey);
    if (storedWeak) {
      try {
        const parsed = JSON.parse(storedWeak);
        setWeakTopics(parsed);
        if (isRemediation) {
           start(parsed);
        }
      } catch (e) {
        setWeakTopics([]);
      }
    } else if (isRemediation) {
        onBack(); // Nothing to remediate
    }

    if (!isRemediation) {
        const saved = localStorage.getItem(sessionKey);
        if (saved) { /* Optional: Restore previous session logic */ }
    }
  }, [sessionKey, weakKey, isRemediation]);

  const saveProgress = useCallback((updatedIndex: number, updatedScore: number, updatedIncorrect: IncorrectAnswer[], currentQuestions: QuizQuestion[]) => {
    if (isRemediation) return;
    const sessionData = {
      questions: currentQuestions,
      currentIndex: updatedIndex,
      score: updatedScore,
      incorrect: updatedIncorrect,
      timestamp: new Date().toISOString(),
      subject: profile.subject
    };
    localStorage.setItem(sessionKey, JSON.stringify(sessionData));
  }, [sessionKey, profile.subject, isRemediation]);

  const start = async (providedWeak?: string[]) => {
    setStatus('loading');
    const activeWeak = providedWeak || weakTopics;
    const topicsArray = focusTopics.split(',').map(t => t.trim()).filter(t => t.length > 0);
    try {
      const qs = await generateQuizQuestions(profile, activeWeak, topicsArray, questionCount, isRemediation);
      setQuestions(qs);
      setScore(0);
      setCurrentIndex(0);
      setIncorrect([]);
      setSelected(null);
      saveProgress(0, 0, [], qs);
      setStatus('active');
    } catch (e) {
      if (isRemediation) onBack();
      else setStatus('intro');
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
      finalizeQuiz();
    }
  };

  const finalizeQuiz = async () => {
    const totalAnswered = currentIndex + (selected ? 1 : 0);
    if (totalAnswered === 0) {
      onBack();
      return;
    }
    
    const newlyWeak = incorrect.map(i => i.question.topic);
    const combined = Array.from(new Set([...weakTopics, ...newlyWeak])).slice(-20);
    localStorage.setItem(weakKey, JSON.stringify(combined));

    setStatus('loading');
    try {
      if (incorrect.length > 0) {
        const feedback = await generateReview(incorrect, profile);
        setReviews(feedback);
      }
    } catch (e) {
      console.error("Failed to generate AI feedback", e);
    }
    setStatus('review');
  };

  const commitData = () => {
    const totalAnswered = currentIndex + (selected ? 1 : 0);
    const finalScore = Math.round((score / totalAnswered) * 100);
    onTestComplete(finalScore);
    localStorage.removeItem(sessionKey);
    onBack();
  };

  if (status === 'loading') return (
    <div className="flex flex-col items-center">
      <LoadingSpinner />
      <p className="mt-8 font-black text-primary animate-pulse tracking-widest text-[10px] uppercase">
        {isRemediation ? 'SYNTHESIZING REMEDIATION SCENARIOS...' : 'Processing Session Artifacts...'}
      </p>
    </div>
  );

  if (status === 'intro') return (
    <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-10 animate-in zoom-in duration-300">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center mb-5 text-primary ring-1 ring-border shadow-sm">
          <span className="material-icons-round text-3xl">bolt</span>
        </div>
        <h2 className="text-2xl font-black uppercase italic">Simulation Hub</h2>
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Target: {profile.subject}</p>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Sim Focus (Optional)</label>
          <input type="text" value={focusTopics} onChange={(e) => setFocusTopics(e.target.value)} placeholder="e.g. Algebra, History..." className="w-full bg-background border border-border rounded-xl p-4 text-xs text-foreground placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary outline-none transition-all" />
        </div>

        <div className="space-y-3">
          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Assessment Size</label>
          <div className="grid grid-cols-3 gap-2">
            {([10, 25, 30] as QuestionCount[]).map((count) => (
              <button key={count} onClick={() => setQuestionCount(count)} className={`py-3 rounded-xl border font-black text-[9px] uppercase transition-all tracking-wider ${questionCount === count ? 'bg-primary border-primary text-primary-foreground shadow-lg' : 'bg-background border-border text-muted-foreground hover:border-primary/50'}`}>
                {count} Qs
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button onClick={() => start()} size="lg" className="w-full text-[10px] uppercase tracking-widest">INITIALIZE SIMULATION</Button>
          <Button onClick={onBack} variant="ghost" className="w-full text-[10px] uppercase tracking-widest">ABORT</Button>
        </div>
      </div>
    </div>
  );

  if (status === 'review') return (
    <div className="w-full max-w-2xl space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-card border border-border p-12 rounded-2xl shadow-2xl relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary"></div>
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-4 block">
            {isRemediation ? 'Remediation Session Finished' : 'Simulation Complete'}
        </span>
        <span className="text-6xl md:text-8xl font-black text-primary drop-shadow-sm">{Math.round((score/questions.length)*100)}%</span>
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-6 italic">Mastery achieved across {questions.length} cycles</p>
      </div>

      {reviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] px-2 text-primary">Neural Gaps Analysis</h3>
          {reviews.map((r, i) => (
            <div key={i} className="bg-card border border-border p-8 rounded-2xl shadow-lg animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${i * 100}ms` }}>
              <h4 className="font-bold text-foreground mb-6 leading-tight italic">{r.question}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-destructive/5 p-4 rounded-xl border border-destructive/10"><span className="text-[9px] font-black uppercase text-destructive mb-2 block tracking-widest">Your Input</span><p className="text-xs font-bold opacity-70">{r.userAnswer}</p></div>
                <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/10"><span className="text-[9px] font-black uppercase text-green-500 mb-2 block tracking-widest">Target Answer</span><p className="text-xs font-bold">{r.correctAnswer}</p></div>
              </div>
              <div className="bg-secondary p-5 rounded-xl text-xs leading-relaxed text-muted-foreground italic border-l-4 border-primary shadow-inner">
                <span className="text-[9px] font-black text-primary uppercase block mb-2 not-italic tracking-widest">Expert Briefing</span>
                {r.explanation}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button onClick={commitData} size="lg" className="w-full text-[10px] uppercase tracking-widest bg-green-600 hover:bg-green-700 shadow-lg">SAVE DATA & RETURN HOME</Button>
        <Button onClick={onBack} variant="ghost" className="w-full text-[10px] uppercase tracking-widest text-destructive">EXIT WITHOUT SAVING</Button>
      </div>
    </div>
  );

  const q = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="w-full flex flex-col items-center">
      <div className="fixed top-0 left-0 w-full h-1.5 bg-secondary z-[60]">
        <div 
          className={`h-full ${isRemediation ? 'bg-destructive' : 'bg-primary'} shadow-[0_0_15px_rgba(79,70,229,0.8)] transition-all duration-500 ease-out`}
          style={{ width: `${progress}%` }}
        ></div>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card border border-border px-4 py-1.5 rounded-full shadow-lg">
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">
             {isRemediation ? 'REMEDIATION' : 'Question'} {currentIndex + 1} <span className="text-muted-foreground">/ {questions.length}</span>
           </span>
        </div>
      </div>

      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl p-8 mt-16 relative overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between mb-10">
          <div className="flex flex-col">
            <span className={`text-[10px] font-black ${isRemediation ? 'text-destructive' : 'text-primary'} uppercase tracking-[0.3em] mb-1`}>{profile.subject}</span>
            <span className="text-xl font-black">{isRemediation ? 'Restoration Phase' : 'Active Phase'}</span>
          </div>
          <button onClick={finalizeQuiz} className="text-[9px] font-black uppercase tracking-widest text-destructive hover:opacity-70 transition-opacity flex items-center gap-2">
            <span className="material-icons-round text-sm">cancel</span>
            Abort
          </button>
        </div>
        <div className="mb-6 flex items-center gap-2">
            <span className={`material-icons-round ${isRemediation ? 'text-destructive' : 'text-primary'} text-xs`}>label</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{q.topic}</span>
        </div>
        <h3 className="text-xl md:text-2xl font-black mb-10 leading-tight italic">{q.question}</h3>
        <div className="grid grid-cols-1 gap-3 mb-10">
          {q.options.map(opt => {
            const isSelected = selected === opt;
            const isCorrect = opt === q.correctAnswer;
            let style = 'bg-background border-border hover:border-primary/50 text-muted-foreground';
            if (selected) {
              if (isCorrect) style = 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-500/20';
              else if (isSelected) style = 'bg-destructive border-destructive text-white';
              else style = 'bg-background border-border opacity-30';
            }
            return (
              <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!selected} className={`p-5 rounded-xl border text-left transition-all duration-300 font-bold group flex items-center justify-between ${style}`}>
                <span className="text-sm font-bold uppercase tracking-wide">{opt}</span>
                {selected && isCorrect && <span className="material-icons-round text-sm">check_circle</span>}
                {selected && isSelected && !isCorrect && <span className="material-icons-round text-sm">cancel</span>}
              </button>
            );
          })}
        </div>
        {selected && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Button onClick={next} size="lg" className="w-full text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
              {currentIndex === questions.length - 1 ? 'Finalize Protocol' : 'Next Cycle'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;
