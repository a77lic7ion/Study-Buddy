import React, { useState, useCallback, useMemo } from 'react';
import { FLASHCARD_CONTENT } from '../constants';
import { Flashcard } from '../types';
import Button from './Button';
import { playCorrectSound, playIncorrectSound } from '../utils/soundUtils';

interface FlashcardViewerProps {
  onBack: () => void;
  onTestComplete: (score: number) => void;
}

// Fisher-Yates shuffle algorithm
const shuffleArray = (array: Flashcard[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ onBack, onTestComplete }) => {
  // Shuffle cards on component mount for a random study session every time
  const [studyCards] = useState(() => shuffleArray(FLASHCARD_CONTENT));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Test mode state
  const [isTestMode, setIsTestMode] = useState(false);
  const [isTestFinished, setIsTestFinished] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>([]);
  const [testIndex, setTestIndex] = useState(0);
  const [testScore, setTestScore] = useState(0);
  const [showTestAnswer, setShowTestAnswer] = useState(false);

  const currentCard = useMemo(() => 
    isTestMode ? shuffledCards[testIndex] : studyCards[currentIndex],
    [isTestMode, shuffledCards, testIndex, studyCards, currentIndex]
  );
  
  const totalCards = useMemo(() => 
    isTestMode ? shuffledCards.length : studyCards.length,
    [isTestMode, shuffledCards, studyCards]
  );

  const startTest = useCallback(() => {
    // Start test with a fresh shuffle from the master list
    setShuffledCards(shuffleArray(FLASHCARD_CONTENT));
    setTestIndex(0);
    setTestScore(0);
    setIsTestMode(true);
    setIsTestFinished(false);
    setShowTestAnswer(false);
    setIsFlipped(false);
  }, []);

  const handleTestAnswer = useCallback((knewIt: boolean) => {
    if (knewIt) {
      playCorrectSound();
      setTestScore(prev => prev + 1);
    } else {
      playIncorrectSound();
    }
    
    if (testIndex < shuffledCards.length - 1) {
      setTestIndex(prev => prev + 1);
      setShowTestAnswer(false);
      setIsFlipped(false);
    } else {
      const finalScore = Math.round(((knewIt ? testScore + 1 : testScore) / shuffledCards.length) * 100);
      onTestComplete(finalScore);
      setIsTestFinished(true);
    }
  }, [testIndex, shuffledCards.length, testScore, onTestComplete]);
  
  const exitTest = useCallback(() => {
    setIsTestMode(false);
    setIsTestFinished(false);
    setCurrentIndex(0); // Reset study view
  }, []);

  const goToNextCard = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % studyCards.length);
    }, 150);
  }, [studyCards.length]);

  const goToPrevCard = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === 0 ? studyCards.length - 1 : prevIndex - 1
      );
    }, 150);
  }, [studyCards.length]);
  
  const startOver = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentIndex(0);
    }, 150);
  }, []);

  const flipCard = () => {
    if (!isTestMode) {
      setIsFlipped(!isFlipped);
    }
  };
  
  if (isTestMode) {
    if (isTestFinished) {
      const percentage = shuffledCards.length > 0 ? Math.round((testScore / shuffledCards.length) * 100) : 0;
      return (
        <div className="text-center bg-slate-800 p-8 rounded-lg shadow-xl">
          <h2 className="text-3xl font-bold mb-4 text-cyan-400">Self-Test Complete!</h2>
          <p className="text-xl mb-2 text-slate-200">Your Score:</p>
          <p className="text-6xl font-bold mb-6 text-white">{percentage}%</p>
          <p className="text-lg text-slate-300 mb-8">You knew {testScore} out of {shuffledCards.length} terms.</p>
          <div className="flex gap-4 justify-center">
              <Button onClick={startTest}>Take Again</Button>
              <Button onClick={exitTest} variant="ghost">Back to Study Mode</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center w-full">
        <div className="w-full max-w-lg mb-6" style={{ perspective: '1000px' }}>
          <div 
            className="relative w-full h-80 transition-transform duration-700"
            style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          >
            <div className="absolute w-full h-full bg-slate-800 border border-slate-700 rounded-xl shadow-lg flex items-center justify-center p-6 text-center" style={{ backfaceVisibility: 'hidden' }}>
              <h2 className="text-3xl font-bold text-cyan-400">{currentCard?.term}</h2>
            </div>
            <div className="absolute w-full h-full bg-slate-700 border border-slate-600 rounded-xl shadow-lg flex items-center justify-center p-6 text-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
               <div className="flex flex-col items-center justify-center gap-4">
                <p className="text-lg text-slate-200 whitespace-pre-wrap">{currentCard?.definition}</p>
                {currentCard?.symbol && (
                  <div className="mt-4 text-slate-200" dangerouslySetInnerHTML={{ __html: currentCard.symbol }} />
                )}
              </div>
            </div>
          </div>
        </div>
        <p className="text-slate-400 mb-4">Card {testIndex + 1} of {totalCards}</p>
        <div className="flex justify-center w-full max-w-lg mb-6 gap-4">
          {!showTestAnswer ? (
            <Button onClick={() => { setShowTestAnswer(true); setIsFlipped(true); }} size="lg">Show Answer</Button>
          ) : (
            <>
              <Button onClick={() => handleTestAnswer(true)} variant="primary">I Knew It 👍</Button>
              <Button onClick={() => handleTestAnswer(false)} variant="secondary">Needs Review 👎</Button>
            </>
          )}
        </div>
         <Button onClick={exitTest} variant="ghost">End Test</Button>
      </div>
    );
  }

  // Default Study Mode
  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-lg mb-6" style={{ perspective: '1000px' }}>
        <div 
          className="relative w-full h-80 cursor-pointer transition-transform duration-700"
          style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          onClick={flipCard}
          aria-roledescription="flashcard"
        >
          {/* Front of Card */}
          <div aria-hidden={isFlipped} className="absolute w-full h-full bg-slate-800 border border-slate-700 rounded-xl shadow-lg flex items-center justify-center p-6 text-center" style={{ backfaceVisibility: 'hidden' }}>
            <h2 className="text-3xl font-bold text-cyan-400">{currentCard?.term}</h2>
          </div>
          {/* Back of Card */}
          <div aria-hidden={!isFlipped} className="absolute w-full h-full bg-slate-700 border border-slate-600 rounded-xl shadow-lg flex items-center justify-center p-6 text-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <div className="flex flex-col items-center justify-center gap-4">
              <p className="text-lg text-slate-200 whitespace-pre-wrap">{currentCard?.definition}</p>
              {currentCard?.symbol && (
                <div
                  className="mt-4 text-slate-200"
                  dangerouslySetInnerHTML={{ __html: currentCard.symbol }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-slate-400 mb-4">
        Card {currentIndex + 1} of {totalCards}
      </p>

      <div className="flex justify-between w-full max-w-lg mb-6">
        <Button onClick={goToPrevCard}>Previous</Button>
        <Button onClick={goToNextCard}>Next</Button>
      </div>
      
      <div className="flex gap-4">
        <Button onClick={startOver} variant="ghost">Start Over</Button>
        <Button onClick={startTest} variant="ghost">Start Self-Test</Button>
        <Button onClick={onBack} variant="ghost">Back to Home</Button>
      </div>
    </div>
  );
};

export default FlashcardViewer;