
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
type CardCount = 10 | 25 | 40;

const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ profile, userId, onBack, onTestComplete }) => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'setup' | 'active' | 'summary'>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [cardCount, setCardCount] = useState<CardCount>(10);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [testScore, setTestScore] = useState(0);
  const [cardsEvaluated, setCardsEvaluated] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const persistenceKey = `flashcard_session_${userId}_${profile.grade}_${profile.subject}`;

  useEffect(() => {
    const savedSession = localStorage.getItem(persistenceKey);
    if (savedSession) {
      try {
        const { cards: savedCards, index: savedIndex } = JSON.parse(savedSession);
        if (savedCards && savedCards.length > 0) {
          setCards(savedCards);
          setCurrentIndex(savedIndex || 0);
          setStatus('active');
        }
      } catch (e) {
        console.error("Failed to load saved session", e);
      }
    }
  }, [persistenceKey]);

  useEffect(() => {
    if (status === 'active' && !loading && cards.length > 0) {
      localStorage.setItem(persistenceKey, JSON.stringify({ cards, index: currentIndex }));
    }
  }, [currentIndex, cards, status, loading, persistenceKey]);

  const startSession = async () => {
    setLoading(true);
    try {
      const aiCards = await generateFlashcards(profile, difficulty, cardCount);
      setCards(aiCards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowAnswer(false);
      setTestScore(0);
      setCardsEvaluated(0);
      setSelectedOption(null);
      setShowExplanation(false);
      localStorage.setItem(persistenceKey, JSON.stringify({ cards: aiCards, index: 0 }));
      setStatus('active');
    } catch (e) {
      console.error(e);
      setStatus('setup');
    } finally {
      setLoading(false);
    }
  };

  const handleCardChange = (newIndex: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setIsFlipped(false);
      setShowAnswer(false);
      setSelectedOption(null);
      setShowExplanation(false);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 250);
  };

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      handleCardChange(currentIndex + 1);
    } else {
      setStatus('summary');
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) handleCardChange(currentIndex - 1);
  };

  const commitData = () => {
    if (cardsEvaluated === 0) {
      onBack();
      return;
    }
    const finalScore = Math.round((testScore / cardsEvaluated) * 100);
    onTestComplete(finalScore);
    localStorage.removeItem(persistenceKey);
    onBack();
  };

  const handleTestAnswer = (knewIt: boolean) => {
    if (knewIt) {
      playCorrectSound();
      setTestScore(s => s + 1);
    } else {
      playIncorrectSound();
    }
    setCardsEvaluated(e => e + 1);
    nextCard();
  };

  const handleMCOptionSelect = (opt: string) => {
    if (selectedOption || !isTestMode) return;
    setSelectedOption(opt);
    const isCorrect = opt === cards[currentIndex].definition;
    setIsFlipped(true);
    setShowAnswer(true);
    setCardsEvaluated(e => e + 1);
    if (isCorrect) {
      playCorrectSound();
      setTestScore(s => s + 1);
    } else {
      playIncorrectSound();
    }
  };

  const handleSkip = () => {
    if (isTransitioning) return;
    nextCard();
  };

  if (status === 'setup') {
    return (
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-10 animate-in zoom-in duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center mb-5 text-primary ring-1 ring-border shadow-sm">
            <span className="material-icons-round text-3xl">psychology</span>
          </div>
          <h2 className="text-2xl font-black uppercase italic">Neural Forge</h2>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Calibrating difficulty for {profile.subject}</p>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Complexity Level</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((level) => (
                <button key={level} onClick={() => setDifficulty(level)} className={`py-3 rounded-xl border font-black text-[9px] uppercase transition-all tracking-wider ${difficulty === level ? 'bg-primary border-primary text-primary-foreground shadow-lg' : 'bg-background border-border text-muted-foreground hover:border-primary/50'}`}>
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Forge Count</label>
            <div className="grid grid-cols-3 gap-2">
              {([10, 25, 40] as CardCount[]).map((count) => (
                <button key={count} onClick={() => setCardCount(count)} className={`py-3 rounded-xl border font-black text-[9px] uppercase transition-all tracking-wider ${cardCount === count ? 'bg-primary border-primary text-primary-foreground shadow-lg' : 'bg-background border-border text-muted-foreground hover:border-primary/50'}`}>
                  {count} Cards
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={startSession} size="lg" className="w-full text-[10px] uppercase tracking-[0.3em]">GENERATE NEURAL DECK</Button>
            <Button onClick={onBack} variant="ghost" className="w-full text-[10px] uppercase tracking-widest">RETURN HOME</Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex flex-col items-center animate-in fade-in duration-700">
      <LoadingSpinner />
      <p className="mt-8 font-black text-primary animate-pulse tracking-widest text-[10px] uppercase">Synthesizing Learning Assets...</p>
    </div>
  );

  if (status === 'summary') {
    const finalScore = cardsEvaluated > 0 ? Math.round((testScore / cardsEvaluated) * 100) : 0;
    return (
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-10 animate-in zoom-in duration-500 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 text-primary border border-primary/20 shadow-xl">
          <span className="material-icons-round text-5xl">task_alt</span>
        </div>
        <h2 className="text-3xl font-black uppercase italic italic mb-2">Cycle Complete</h2>
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-10">Neural artifacts successfully reviewed</p>
        
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="p-4 bg-secondary/30 rounded-xl border border-border">
            <span className="text-[9px] font-black uppercase text-muted-foreground block mb-2">Retention Score</span>
            <span className="text-3xl font-black text-primary">{finalScore}%</span>
          </div>
          <div className="p-4 bg-secondary/30 rounded-xl border border-border">
            <span className="text-[9px] font-black uppercase text-muted-foreground block mb-2">Cards Analyzed</span>
            <span className="text-3xl font-black text-foreground">{cardsEvaluated}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={commitData} size="lg" className="w-full text-[10px] uppercase tracking-widest bg-green-600 hover:bg-green-700">SAVE DATA & RETURN</Button>
          <Button onClick={onBack} variant="ghost" className="w-full text-[10px] uppercase tracking-widest text-destructive">EXIT WITHOUT SAVING</Button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const isMultipleChoice = currentCard?.options && currentCard.options.length > 0;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="w-full mb-8 flex items-center justify-between px-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">
            {isTestMode ? (isMultipleChoice ? "MULTIPLE CHOICE MODE" : "ACTIVE RECALL MODE") : "PRACTICE SESSION"}
          </span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span>
            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Target: {difficulty} • Mastery: {cardsEvaluated > 0 ? Math.round((testScore/cardsEvaluated)*100) : 0}%</span>
          </div>
        </div>
        <div className="bg-secondary/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-border shadow-inner">
          <span className="text-[10px] font-black tracking-[0.2em] font-mono">
            {currentIndex + 1} <span className="text-muted-foreground">/</span> {cards.length}
          </span>
        </div>
      </div>

      <div className="w-full mb-10 group" style={{ perspective: '2000px' }}>
        <div 
          className={`relative w-full min-h-[22rem] transition-all duration-700 ease-out preserve-3d cursor-pointer 
            ${isFlipped ? '[transform:rotateY(180deg)]' : ''} 
            ${isTransitioning ? 'opacity-0 scale-95 -translate-y-4' : 'opacity-100 scale-100 translate-y-0'}`}
          onClick={() => !isTransitioning && !isMultipleChoice && setIsFlipped(!isFlipped)}
        >
          {/* Front of card */}
          <div className={`absolute inset-0 bg-card border border-border rounded-2xl shadow-2xl flex flex-col items-center justify-center p-12 text-center backface-hidden ring-1 ring-white/5 transition-opacity duration-300 ${isFlipped ? 'opacity-0' : 'opacity-100'}`} style={{ zIndex: isFlipped ? 0 : 1 }}>
             <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-secondary border border-border rounded-full shadow-sm">
               <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground">{isMultipleChoice ? 'CHALLENGE' : 'QUESTION'}</span>
             </div>
             <h2 className="text-xl md:text-2xl font-black leading-tight text-foreground italic antialiased">{currentCard?.term}</h2>
          </div>

          {/* Back of card */}
          <div className={`absolute inset-0 bg-primary/5 border border-primary/20 rounded-2xl shadow-2xl flex flex-col items-center justify-start p-12 text-center backface-hidden [transform:rotateY(180deg)] ring-1 ring-primary/20 transition-opacity duration-300 overflow-y-auto custom-scrollbar ${isFlipped ? 'opacity-100' : 'opacity-0'}`} style={{ zIndex: isFlipped ? 1 : 0 }}>
             <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary/20 border border-primary/30 rounded-full shadow-sm">
               <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">DEFINITION</span>
             </div>
             
             <div className="mt-8 flex flex-col items-center gap-6 w-full">
               <p className="text-base md:text-lg font-bold leading-relaxed text-foreground antialiased max-w-sm">{currentCard?.definition}</p>
               
               {/* AI Explanation Toggle & Content */}
               <div className="w-full border-t border-primary/10 pt-6 mt-2 space-y-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowExplanation(!showExplanation); }}
                    className="flex items-center gap-2 mx-auto text-[9px] font-black uppercase tracking-[0.3em] text-primary/70 hover:text-primary transition-colors"
                  >
                    <span className="material-icons-round text-sm">{showExplanation ? 'visibility_off' : 'auto_awesome'}</span>
                    {showExplanation ? 'HIDE BREAKDOWN' : 'EXPLAIN CONCEPT'}
                  </button>
                  
                  {showExplanation && (
                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-6 text-xs text-left leading-relaxed text-muted-foreground italic animate-in fade-in slide-in-from-top-2 duration-300">
                      <span className="text-[8px] font-black text-primary uppercase block mb-3 tracking-widest not-italic">Neural Insights</span>
                      {currentCard?.explanation}
                    </div>
                  )}
               </div>
             </div>
          </div>
        </div>
      </div>

      {isTestMode && isMultipleChoice && !selectedOption && !isTransitioning && (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 animate-in slide-in-from-bottom-4 duration-300">
          {currentCard.options?.map((opt, i) => (
            <button key={i} onClick={() => handleMCOptionSelect(opt)} className="p-5 bg-card border border-border rounded-xl text-left text-[11px] font-black uppercase tracking-wider hover:border-primary hover:bg-primary/5 transition-all shadow-sm">
              {opt}
            </button>
          ))}
        </div>
      )}

      <div className="w-full space-y-6">
        {isTestMode ? (
          <div className="space-y-4">
            {isMultipleChoice ? (
              selectedOption ? (
                <div className="space-y-4">
                  <div className={`p-5 rounded-xl border flex items-center justify-between ${selectedOption === currentCard.definition ? 'bg-green-500/10 border-green-500/30 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-destructive/10 border-destructive/30 text-destructive'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest">{selectedOption === currentCard.definition ? 'CORRECT RECALL' : 'INCORRECT'}</span>
                    <span className="material-icons-round">{selectedOption === currentCard.definition ? 'check_circle' : 'cancel'}</span>
                  </div>
                  <Button onClick={nextCard} size="lg" className="w-full py-5 text-[10px] uppercase tracking-[0.3em]">CONTINUE MODULE</Button>
                </div>
              ) : (
                <Button onClick={handleSkip} variant="ghost" className="w-full py-4 text-[9px] uppercase tracking-widest border-border opacity-70">SKIP CARD</Button>
              )
            ) : (
              !showAnswer ? (
                <div className="flex flex-col gap-3">
                  <Button onClick={() => {setShowAnswer(true); setIsFlipped(true); setShowExplanation(true);}} size="lg" className="w-full py-5 text-[10px] uppercase tracking-[0.3em] bg-white text-black hover:bg-white/90 shadow-xl">REVEAL ANSWER</Button>
                  <Button onClick={handleSkip} variant="ghost" className="w-full py-4 text-[9px] uppercase tracking-widest border-border">SKIP CARD</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button onClick={() => handleTestAnswer(true)} variant="primary" className="py-5 text-[10px] uppercase tracking-[0.2em] bg-green-600 hover:bg-green-500 shadow-lg shadow-green-500/20">CORRECT RECALL</Button>
                    <Button onClick={() => handleTestAnswer(false)} variant="secondary" className="py-5 text-[10px] uppercase tracking-[0.2em] border-destructive/30 text-destructive hover:bg-destructive/5">NEEDS REVIEW</Button>
                  </div>
                  <Button onClick={handleSkip} variant="ghost" className="w-full py-4 text-[9px] uppercase tracking-widest border-border opacity-70">SKIP CARD</Button>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="bg-secondary/40 border border-border p-5 rounded-2xl flex items-center justify-between backdrop-blur-md shadow-lg">
            <button onClick={prevCard} disabled={currentIndex === 0 || isTransitioning} className="p-3 text-muted-foreground hover:text-primary transition-all disabled:opacity-20 active:scale-90"><span className="material-icons-round">arrow_back_ios_new</span></button>
            <div className="flex flex-col items-center gap-3">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">PROGRESS INDEX</span>
              <div className="flex gap-1.5">
                {cards.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-700 ${i === currentIndex ? 'bg-primary w-8 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-border w-1.5'}`}></div>
                ))}
              </div>
            </div>
            <button onClick={nextCard} disabled={currentIndex === cards.length - 1 || isTransitioning} className="p-3 text-muted-foreground hover:text-primary transition-all disabled:opacity-20 active:scale-90"><span className="material-icons-round">arrow_forward_ios</span></button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button onClick={() => setStatus('summary')} variant="ghost" className="text-[9px] uppercase tracking-widest border-border text-destructive hover:bg-destructive/10">END SESSION</Button>
          <Button onClick={() => setStatus('setup')} variant="ghost" className="text-[9px] uppercase tracking-widest border-border">NEW BATCH</Button>
          {isTestMode ? (
            <Button onClick={() => setIsTestMode(false)} variant="secondary" className="text-[9px] uppercase tracking-widest border-border">PRACTICE MODE</Button>
          ) : (
            <Button onClick={() => setIsTestMode(true)} variant="secondary" className="text-[9px] uppercase tracking-widest border-primary/20 text-primary bg-primary/5 hover:bg-primary/10">ACTIVE RECALL</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashcardViewer;
