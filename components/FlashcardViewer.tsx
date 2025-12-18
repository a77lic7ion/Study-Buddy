import React, { useState, useCallback, useEffect } from 'react';
import { Flashcard, UserProfile } from '../types';
import { generateFlashcards } from '../services/geminiService';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { playCorrectSound, playIncorrectSound } from '../utils/soundUtils';

interface FlashcardViewerProps {
  profile: UserProfile;
  userId: string;
  onBack: () => void;
  onTestComplete: (score: number) => void;
}

type Difficulty = 'Easy' | 'Medium' | 'Hard';

const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ profile, userId, onBack, onTestComplete }) => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [preSetup, setPreSetup] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [testScore, setTestScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const persistenceKey = `flashcard_session_${userId}_${profile.grade}_${profile.subject}`;

  useEffect(() => {
    const savedSession = localStorage.getItem(persistenceKey);
    if (savedSession) {
      try {
        const { cards: savedCards, index: savedIndex } = JSON.parse(savedSession);
        if (savedCards && savedCards.length > 0) {
          setCards(savedCards);
          setCurrentIndex(savedIndex || 0);
          setPreSetup(false);
        }
      } catch (e) {
        console.error("Failed to load saved session", e);
      }
    }
  }, [persistenceKey]);

  useEffect(() => {
    if (!preSetup && !loading && cards.length > 0) {
      localStorage.setItem(persistenceKey, JSON.stringify({ cards, index: currentIndex }));
    }
  }, [currentIndex, cards, preSetup, loading, persistenceKey]);

  const startSession = async () => {
    setLoading(true);
    setPreSetup(false);
    try {
      const aiCards = await generateFlashcards(profile, difficulty);
      setCards(aiCards);
      setCurrentIndex(0);
      localStorage.setItem(persistenceKey, JSON.stringify({ cards: aiCards, index: 0 }));
    } catch (e) {
      console.error(e);
      setPreSetup(true);
    } finally {
      setLoading(false);
    }
  };

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(i => i + 1);
      setIsFlipped(false);
      setShowAnswer(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setIsFlipped(false);
      setShowAnswer(false);
    }
  };

  const handleTestAnswer = (knewIt: boolean) => {
    if (knewIt) {
      playCorrectSound();
      setTestScore(s => s + 1);
    } else {
      playIncorrectSound();
    }

    if (currentIndex < cards.length - 1) {
      nextCard();
    } else {
      onTestComplete(Math.round(((knewIt ? testScore + 1 : testScore) / cards.length) * 100));
      localStorage.removeItem(persistenceKey);
      onBack();
    }
  };

  if (preSetup) {
    return (
      <div className="text-center bg-slate-800 p-8 rounded-[2rem] border-2 border-slate-700 max-w-lg mx-auto shadow-2xl animate-in fade-in zoom-in duration-500">
        <h2 className="text-3xl font-black italic uppercase mb-6 tracking-tighter text-white">Flashcard Setup</h2>
        <p className="text-slate-400 mb-8 leading-relaxed">Choose your challenge level for <span className="text-cyan-400 font-bold">{profile.subject}</span>.</p>
        
        <div className="grid grid-cols-3 gap-3 mb-8">
          {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((level) => (
            <button
              key={level}
              onClick={() => setDifficulty(level)}
              className={`py-3 rounded-xl border-2 font-bold transition-all ${
                difficulty === level 
                  ? 'bg-cyan-500 border-cyan-400 text-slate-900 scale-105 shadow-lg shadow-cyan-500/20' 
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <Button onClick={startSession} size="lg" className="w-full py-5 text-xl">Generate Deck</Button>
          <Button onClick={onBack} variant="ghost" className="w-full border-slate-700">Cancel</Button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="text-center animate-pulse"><LoadingSpinner /><p className="mt-4 font-bold text-slate-400">Forging your flashcards...</p></div>;

  const currentCard = cards[currentIndex];

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Mode Header */}
      <div className="w-full mb-6 flex justify-between items-center px-2">
        <div className="flex flex-col">
           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500">
            {isTestMode ? "Active Recall Mode" : "Practice Mode"}
          </h3>
          <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5 tracking-wider">Level: {difficulty}</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-slate-400 font-black tracking-widest text-xs bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700 shadow-inner">
            {currentIndex + 1} <span className="opacity-40 mx-0.5">/</span> {cards.length}
          </span>
        </div>
      </div>

      <div className="w-full mb-10 group" style={{ perspective: '1500px' }}>
        <div 
          className="relative w-full h-80 transition-transform duration-700 cursor-pointer preserve-3d"
          style={{ 
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transformStyle: 'preserve-3d'
          }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front Side: Question */}
          <div 
            className="absolute inset-0 bg-slate-800 border-[3px] border-cyan-500/50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center p-8 text-center" 
            style={{ 
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              zIndex: isFlipped ? 0 : 2
            }}
          >
            <span className="absolute -bottom-16 -right-16 text-[260px] font-black text-cyan-500 opacity-[0.07] select-none pointer-events-none rotate-12">?</span>
            <div className="relative z-10 flex flex-col items-center w-full">
              <div className="px-5 py-2 bg-cyan-950/40 text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] mb-10 rounded-full border border-cyan-500/20 backdrop-blur-sm">
                Question
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white leading-snug drop-shadow-2xl">{currentCard?.term}</h2>
            </div>
          </div>
          
          {/* Back Side: Answer */}
          <div 
            className="absolute inset-0 bg-indigo-950 border-[3px] border-indigo-400/50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center p-8 text-center" 
            style={{ 
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              zIndex: isFlipped ? 2 : 0
            }}
          >
            <span className="absolute -top-16 -left-16 text-[260px] font-black text-indigo-400 opacity-[0.1] select-none pointer-events-none -rotate-12">A</span>
            <div className="relative z-10 flex flex-col items-center w-full">
              <div className="px-5 py-2 bg-indigo-900/40 text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em] mb-10 rounded-full border border-indigo-400/20 backdrop-blur-sm">
                Answer
              </div>
              <p className="text-lg md:text-xl text-slate-100 font-black leading-relaxed max-w-sm">{currentCard?.definition}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-6">
        {isTestMode ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            {!showAnswer ? (
              <Button onClick={() => {setShowAnswer(true); setIsFlipped(true);}} size="lg" className="w-full py-6 text-xl shadow-cyan-500/10 shadow-2xl rounded-2xl">Reveal Answer</Button>
            ) : (
              <div className="flex gap-4">
                <Button onClick={() => handleTestAnswer(true)} className="flex-1 py-6 rounded-2xl shadow-xl hover:scale-[1.02]" variant="primary">Target Hit 👍</Button>
                <Button onClick={() => handleTestAnswer(false)} variant="secondary" className="flex-1 py-6 rounded-2xl shadow-xl hover:scale-[1.02]">More Intel Needed 👎</Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-between items-center bg-slate-800/80 backdrop-blur-sm p-4 rounded-3xl border border-slate-700/50 shadow-2xl">
            <Button onClick={prevCard} disabled={currentIndex === 0} variant="ghost" className="px-6 h-14 rounded-2xl border-slate-700">Prev</Button>
            <div className="flex flex-col items-center px-4">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Sync Progress</span>
               <div className="flex gap-2">
                  {cards.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === currentIndex ? 'bg-cyan-400 w-6' : 'bg-slate-700 w-1.5'}`}></div>
                  ))}
               </div>
            </div>
            <Button onClick={nextCard} disabled={currentIndex === cards.length - 1} variant="ghost" className="px-6 h-14 rounded-2xl border-slate-700">Next</Button>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 mt-2">
          <Button onClick={onBack} variant="ghost" className="text-xs border-slate-700 rounded-xl py-3">Exit Session</Button>
          <Button onClick={() => setPreSetup(true)} variant="ghost" className="text-xs text-slate-400 border-slate-700 rounded-xl py-3">New Mission</Button>
          {isTestMode ? (
            <Button onClick={() => setIsTestMode(false)} variant="primary" className="col-span-2 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-700 hover:shadow-cyan-500/20 shadow-xl">Switch to Practice</Button>
          ) : (
            <Button onClick={() => setIsTestMode(true)} variant="secondary" className="col-span-2 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:shadow-indigo-500/20 shadow-xl">Start Recall Sequence</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashcardViewer;