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
  const [weakTopics, setWeakTopics] = useState<string[]>([]);

  const sessionKey = `quiz_session_${userId}_${profile.grade}_${profile.subject}`;
  const weakKey = `weakTopics_${userId}_${profile.grade}_${profile.subject}`;

  useEffect(() => {
    // Check for saved quiz sessions
    const saved = localStorage.getItem(sessionKey);
    if (saved) setHasSavedSession(true);

    // Initialize/Load weak topics from localStorage on mount
    const storedWeak = localStorage.getItem(weakKey);
    if (storedWeak) {
      try {
        setWeakTopics(JSON.parse(storedWeak));
      } catch (e) {
        console.error("Failed to parse weak topics", e);
        setWeakTopics([]);
      }
    } else {
      // If no topics are found, initialize an empty array in storage
      localStorage.setItem(weakKey, JSON.stringify([]));
      setWeakTopics([]);
    }
  }, [sessionKey, weakKey]);

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
        console.error(e);
        localStorage.removeItem(sessionKey);
        setHasSavedSession(false);
      }
    }
  };

  const start = async () => {
    setStatus('loading');
    const topicsArray = focusTopics.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    try {
      // Use the pre-loaded weakTopics from state for adaptive generation
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
      localStorage.removeItem(sessionKey);

      // Persist newly identified weak topics
      const newlyWeak = incorrect.map(i => i.question.topic);
      const combined = Array.from(new Set([...weakTopics, ...newlyWeak])).slice(-20);
      setWeakTopics(combined);
      localStorage.setItem(weakKey, JSON.stringify(combined));

      if (incorrect.length > 0) {
        setStatus('loading');
        try {
          const feedback = await generateReview(incorrect, profile);
          setReviews(feedback);
        } catch (e) {
          console.error(e);
        }
      }
      setStatus('review');
    }
  };

  if (status === 'loading') return (
    <div className="flex flex-col items-center">
      <LoadingSpinner />
      <p className="mt-8 font-bold text-primary animate-pulse tracking-widest text-xs uppercase">Synthesizing Module...</p>
    </div>
  );

  if (status === 'intro') return (
    <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-2xl p-10 animate-in zoom-in duration-300">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center mb-5 text-primary ring-1 ring-border shadow-sm">
          <span className="material-icons-round text-3xl">bolt</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Quiz Config</h2>
        <p className="text-sm text-muted-foreground font-medium text-center italic">Calibrating neural assessment...</p>
      </div>
      
      <div className="space-y-6">
        {weakTopics.length > 0 && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <span className="text-[9px] font-black text-primary uppercase tracking-widest block mb-2">ADAPTIVE FOCUS DETECTED</span>
            <div className="flex flex-wrap gap-1.5">
              {weakTopics.slice(0, 5).map((topic, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[8px] font-bold uppercase">
                  {topic}
                </span>
              ))}
              {weakTopics.length > 5 && <span className="text-[8px] text-muted-foreground font-bold">+{weakTopics.length - 5} MORE</span>}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Manual Focus Topics</label>
          <input 
            type="text"
            value={focusTopics}
            onChange={(e) => setFocusTopics(e.target.value)}
            placeholder="e.g. Algebra, History..."
            className="w-full bg-background border border-border rounded-lg p-3 py-4 text-sm text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none"
          />
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button onClick={start} size="lg" className="w-full uppercase tracking-widest">START TEST</Button>
          {hasSavedSession && (
            <Button onClick={resumeSession} variant="secondary" className="w-full uppercase tracking-widest">RESUME LAST</Button>
          )}
          <Button onClick={onBack} variant="ghost" className="w-full uppercase tracking-widest">BACK</Button>
        </div>
      </div>
    </div>
  );

  if (status === 'review') return (
    <div className="w-full max-w-2xl space-y-8 animate-in fade-in duration-500">
      <div className="bg-card border border-border p-10 rounded-xl shadow-2xl relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
        <span className="text-5xl md:text-7xl font-black text-primary mb-2 drop-shadow-sm">{Math.round((score/questions.length)*100)}%</span>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.4em] mt-4">Mastery Score</p>
      </div>

      <div className="space-y-4">
        {reviews.map((r, i) => (
          <div key={i} className="bg-card border border-border p-6 rounded-xl animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
            <h4 className="font-bold text-foreground mb-6 leading-tight">{r.question}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
               <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                 <span className="text-[9px] font-black uppercase text-destructive mb-2 block tracking-widest">Your Input</span>
                 <p className="text-sm font-bold">{r.userAnswer}</p>
               </div>
               <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                 <span className="text-[9px] font-black uppercase text-green-500 mb-2 block tracking-widest">Correct Path</span>
                 <p className="text-sm font-bold">{r.correctAnswer}</p>
               </div>
            </div>
            <div className="bg-secondary p-4 rounded-lg text-xs leading-relaxed text-muted-foreground italic border-l-2 border-primary">
              <span className="text-[9px] font-black text-primary uppercase block mb-2 not-italic tracking-widest">AI INSIGHT</span>
              {r.explanation}
            </div>
          </div>
        ))}
      </div>
      <Button onClick={onBack} size="lg" className="w-full uppercase tracking-widest">Finalize Module</Button>
    </div>
  );

  const q = questions[currentIndex];
  return (
    <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl p-8 relative overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between mb-10">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Assessment Engine</span>
          <span className="text-xl font-bold">{currentIndex+1} <span className="text-muted-foreground text-sm font-normal">/ {questions.length}</span></span>
        </div>
        <div className="flex-grow max-w-[200px] h-1.5 bg-secondary rounded-full mx-6 relative">
          <div className="bg-primary h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{width: `${((currentIndex+1)/questions.length)*100}%`}}></div>
        </div>
      </div>
      
      <div className="mb-6 flex items-center gap-2">
         <span className="material-icons-round text-primary text-sm">label</span>
         <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{q.topic}</span>
      </div>
      <h3 className="text-xl md:text-2xl font-bold mb-10 leading-tight">{q.question}</h3>
      
      <div className="grid grid-cols-1 gap-3 mb-10">
        {q.options.map(opt => {
          const isSelected = selected === opt;
          const isCorrect = opt === q.correctAnswer;
          let style = 'bg-background border-border hover:border-primary/50 text-muted-foreground';
          
          if (selected) {
            if (isCorrect) style = 'bg-green-500 border-green-500 text-white scale-[1.02] shadow-lg shadow-green-500/20';
            else if (isSelected) style = 'bg-destructive border-destructive text-white';
            else style = 'bg-background border-border opacity-30';
          }
          
          return (
            <button 
              key={opt} 
              onClick={() => handleAnswer(opt)} 
              disabled={!!selected}
              className={`p-5 rounded-lg border text-left transition-all duration-300 font-bold group flex items-center justify-between ${style}`}
            >
              <span className="text-sm">{opt}</span>
              {selected && isCorrect && <span className="material-icons-round text-sm">check_circle</span>}
              {selected && isSelected && !isCorrect && <span className="material-icons-round text-sm">cancel</span>}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Button onClick={next} size="lg" className="w-full uppercase tracking-widest shadow-lg shadow-primary/20">
            {currentIndex === questions.length - 1 ? 'End Simulation' : 'Next Step'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Quiz;