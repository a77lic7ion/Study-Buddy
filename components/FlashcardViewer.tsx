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
      setIsFlipped(false);
      setShowAnswer(false);
      localStorage.setItem(persistenceKey, JSON.stringify({ cards: aiCards, index: 0 }));
    } catch (e) {
      console.error(e);
      setPreSetup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCardChange = (newIndex: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    // Smooth exit then data swap
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setIsFlipped(false);
      setShowAnswer(false);
      
      // Allow a small delay for state to settle before showing new card
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 250);
  };

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      handleCardChange(currentIndex + 1);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      handleCardChange(currentIndex - 1);
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
          <p className="text-sm text-muted-foreground font-medium text-center italic">Calibrating difficulty for {profile.subject}...</p>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Complexity Level</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`py-3 rounded-lg border font-bold text-[10px] uppercase transition-all tracking-wider ${
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
            <Button onClick={startSession} size="lg" className="w-full text-xs tracking-[0.2em]">
              GENERATE NEURAL DECK
            </Button>
            <Button onClick={onBack} variant="ghost" className="w-full text-xs tracking-widest">
              RETURN HOME
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex flex-col items-center animate-in fade-in duration-700">
      <LoadingSpinner />
      <p className="mt-8 font-bold text-primary animate-pulse tracking-widest text-[10px] uppercase">Synthesizing Learning Assets...</p>
    </div>
  );

  const currentCard = cards[currentIndex];

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Session Metadata */}
      <div className="w-full mb-8 flex items-center justify-between px-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">
            {isTestMode ? "ACTIVE RECALL MODE" : "PRACTICE SESSION"}
          </span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span>
            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Target: {difficulty}</span>
          </div>
        </div>
        <div className="bg-secondary/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-border shadow-inner">
          <span className="text-[10px] font-bold tracking-[0.2em] font-mono">
            {currentIndex + 1} <span className="text-muted-foreground">/</span> {cards.length}
          </span>
        </div>
      </div>

      {/* Main Flashcard with Flip logic */}
      <div className="w-full mb-10 group" style={{ perspective: '2000px' }}>
        <div 
          className={`relative w-full h-[22rem] transition-all duration-700 ease-out preserve-3d cursor-pointer 
            ${isFlipped ? '[transform:rotateY(180deg)]' : ''} 
            ${isTransitioning ? 'opacity-0 scale-95 -translate-y-4' : 'opacity-100 scale-100 translate-y-0'}`}
          onClick={() => !isTransitioning && setIsFlipped(!isFlipped)}
        >
          {/* Front: Question Side */}
          <div 
            className={`absolute inset-0 bg-card border border-border rounded-xl shadow-2xl flex flex-col items-center justify-center p-12 text-center backface-hidden ring-1 ring-white/5 transition-opacity duration-300
              ${isFlipped ? 'opacity-0' : 'opacity-100'}`}
            style={{ zIndex: isFlipped ? 0 : 1 }}
          >
             <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-secondary border border-border rounded-full shadow-sm">
               <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground">QUESTION</span>
             </div>
             <div className="absolute bottom-6 right-8 opacity-5 select-none pointer-events-none">
                <span className="material-icons-round text-8xl">contact_support</span>
             </div>
             <h2 className="text-xl md:text-2xl font-bold leading-tight text-foreground relative z-10 antialiased">
                {currentCard?.term}
             </h2>
          </div>

          {/* Back: Answer Side */}
          <div 
            className={`absolute inset-0 bg-primary/5 border border-primary/20 rounded-xl shadow-2xl flex flex-col items-center justify-center p-12 text-center backface-hidden [transform:rotateY(180deg)] ring-1 ring-primary/20 transition-opacity duration-300
              ${isFlipped ? 'opacity-100' : 'opacity-0'}`}
            style={{ zIndex: isFlipped ? 1 : 0 }}
          >
             <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary/20 border border-primary/30 rounded-full shadow-sm">
               <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">DEFINITION</span>
             </div>
             <div className="absolute bottom-6 left-8 opacity-5 select-none pointer-events-none">
                <span className="material-icons-round text-8xl">auto_awesome</span>
             </div>
             <p className="text-base md:text-lg font-medium leading-relaxed text-foreground relative z-10 antialiased max-w-sm">
                {currentCard?.definition}
             </p>
          </div>
        </div>
      </div>

      {/* Control Interface */}
      <div className="w-full space-y-6">
        {isTestMode ? (
          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
            {!showAnswer ? (
              <Button onClick={() => {setShowAnswer(true); setIsFlipped(true);}} size="lg" className="w-full py-5 text-[10px] uppercase tracking-[0.3em] bg-white text-black hover:bg-white/90 shadow-xl">
                REVEAL ANSWER
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => handleTestAnswer(true)} variant="primary" className="py-5 text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20">
                  CORRECT RECALL
                </Button>
                <Button onClick={() => handleTestAnswer(false)} variant="secondary" className="py-5 text-[10px] uppercase tracking-[0.2em]">
                  NEEDS REVIEW
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-secondary/40 border border-border p-4 rounded-xl flex items-center justify-between backdrop-blur-md shadow-lg">
            <button 
              onClick={prevCard} 
              disabled={currentIndex === 0 || isTransitioning} 
              className="p-3 text-muted-foreground hover:text-primary transition-all disabled:opacity-20 active:scale-90"
            >
              <span className="material-icons-round">arrow_back_ios_new</span>
            </button>
            <div className="flex flex-col items-center gap-3">
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.3em]">PROGRESS INDEX</span>
              <div className="flex gap-1.5">
                {cards.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-700 ${i === currentIndex ? 'bg-primary w-8 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-border w-1.5'}`}></div>
                ))}
              </div>
            </div>
            <button 
              onClick={nextCard} 
              disabled={currentIndex === cards.length - 1 || isTransitioning} 
              className="p-3 text-muted-foreground hover:text-primary transition-all disabled:opacity-20 active:scale-90"
            >
              <span className="material-icons-round">arrow_forward_ios</span>
            </button>
          </div>
        )}

        {/* Global Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button onClick={onBack} variant="ghost" className="text-[9px] uppercase tracking-widest border-border hover:border-destructive/30 hover:text-destructive">
            EXIT SESSION
          </Button>
          <Button onClick={() => setPreSetup(true)} variant="ghost" className="text-[9px] uppercase tracking-widest border-border">
            CONFIGURE NEW
          </Button>
          {isTestMode ? (
            <Button onClick={() => setIsTestMode(false)} variant="secondary" className="text-[9px] uppercase tracking-widest border-border shadow-sm">
              PRACTICE MODE
            </Button>
          ) : (
            <Button onClick={() => setIsTestMode(true)} variant="secondary" className="text-[9px] uppercase tracking-widest border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 shadow-lg shadow-primary/5">
              ACTIVE RECALL
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashcardViewer;