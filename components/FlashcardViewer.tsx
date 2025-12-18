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
  const [isTransitioning, setIsTransitioning] = useState(false);

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
    if (currentIndex < cards.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(i => i + 1);
        setIsFlipped(false);
        setShowAnswer(false);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(i => i - 1);
        setIsFlipped(false);
        setShowAnswer(false);
        setIsTransitioning(false);
      }, 300);
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
      <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-2xl p-10 animate-in zoom-in duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center mb-5 text-primary ring-1 ring-border shadow-sm">
            <span className="material-icons-round text-3xl">psychology</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Configure Deck</h2>
          <p className="text-sm text-muted-foreground font-medium text-center italic">Calibrating AI difficulty for {profile.subject}...</p>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Difficulty Level</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`py-3 rounded-lg border font-bold text-xs uppercase transition-all tracking-wider ${
                    difficulty === level 
                      ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' 
                      : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={startSession} size="lg" className="w-full">
              GENERATE DECK
            </Button>
            <Button onClick={onBack} variant="ghost" className="w-full">
              CANCEL
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex flex-col items-center">
      <LoadingSpinner />
      <p className="mt-8 font-bold text-primary animate-pulse tracking-widest text-xs uppercase">Forging Neural Links...</p>
    </div>
  );

  const currentCard = cards[currentIndex];

  return (
    <div className={`w-full max-w-xl mx-auto flex flex-col items-center transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      <div className="w-full mb-8 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">
            {isTestMode ? "ACTIVE RECALL" : "REVISION MODE"}
          </span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Level: {difficulty}</span>
          </div>
        </div>
        <div className="bg-secondary px-4 py-2 rounded-lg border border-border">
          <span className="text-xs font-bold tracking-widest font-mono">
            {currentIndex + 1} <span className="text-muted-foreground">/</span> {cards.length}
          </span>
        </div>
      </div>

      <div className="w-full mb-10 group" style={{ perspective: '2000px' }}>
        <div 
          className={`relative w-full h-[22rem] transition-all duration-700 ease-in-out preserve-3d cursor-pointer ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front: Question */}
          <div 
            className={`absolute inset-0 bg-card border border-border rounded-xl shadow-2xl flex flex-col items-center justify-center p-12 text-center backface-hidden ring-1 ring-white/5`}
            style={{ zIndex: isFlipped ? 0 : 1 }}
          >
             <div className="absolute top-6 left-1/2 -translate-x-1/2 px-3 py-1 bg-secondary border border-border rounded-full">
               <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground">QUERY</span>
             </div>
             <div className="absolute bottom-4 right-6 opacity-5 select-none pointer-events-none">
                <span className="material-icons-round text-9xl">help_outline</span>
             </div>
             <h2 className="text-xl md:text-2xl font-bold leading-tight text-foreground relative z-10">{currentCard?.term}</h2>
          </div>

          {/* Back: Answer */}
          <div 
            className={`absolute inset-0 bg-primary/5 border border-primary/20 rounded-xl shadow-2xl flex flex-col items-center justify-center p-12 text-center backface-hidden [transform:rotateY(180deg)] ring-1 ring-primary/20`}
            style={{ zIndex: isFlipped ? 1 : 0 }}
          >
             <div className="absolute top-6 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full">
               <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">RESPONSE</span>
             </div>
             <div className="absolute bottom-4 left-6 opacity-5 select-none pointer-events-none">
                <span className="material-icons-round text-9xl">task_alt</span>
             </div>
             <p className="text-base md:text-lg font-medium leading-relaxed text-foreground relative z-10">{currentCard?.definition}</p>
          </div>
        </div>
      </div>

      <div className="w-full space-y-6">
        {isTestMode ? (
          <div className="space-y-4 animate-in slide-in-from-bottom-2">
            {!showAnswer ? (
              <Button onClick={() => {setShowAnswer(true); setIsFlipped(true);}} size="lg" className="w-full py-5 text-sm uppercase tracking-widest bg-white text-black hover:bg-white/90">
                Reveal Response
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => handleTestAnswer(true)} variant="primary" className="py-5 text-sm uppercase">Knew It</Button>
                <Button onClick={() => handleTestAnswer(false)} variant="secondary" className="py-5 text-sm uppercase">Reviewing</Button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-secondary/50 border border-border p-4 rounded-xl flex items-center justify-between backdrop-blur-sm">
            <button onClick={prevCard} disabled={currentIndex === 0 || isTransitioning} className="p-3 hover:text-primary transition-colors disabled:opacity-30">
              <span className="material-icons-round">navigate_before</span>
            </button>
            <div className="flex flex-col items-center gap-3">
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Progress</span>
              <div className="flex gap-1.5">
                {cards.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === currentIndex ? 'bg-primary w-6 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-border w-1.5'}`}></div>
                ))}
              </div>
            </div>
            <button onClick={nextCard} disabled={currentIndex === cards.length - 1 || isTransitioning} className="p-3 hover:text-primary transition-colors disabled:opacity-30">
              <span className="material-icons-round">navigate_next</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button onClick={onBack} variant="ghost" className="text-xs uppercase">Abort</Button>
          <Button onClick={() => setPreSetup(true)} variant="ghost" className="text-xs uppercase">New Mission</Button>
          {isTestMode ? (
            <Button onClick={() => setIsTestMode(false)} variant="secondary" className="text-xs uppercase">Revision Mode</Button>
          ) : (
            <Button onClick={() => setIsTestMode(true)} variant="secondary" className="text-xs uppercase border-primary/20 text-primary">Recall Sequence</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashcardViewer;