import React, { useState, useCallback, useEffect } from 'react';
import { AppView, TestResult } from './types';
import FlashcardViewer from './components/FlashcardViewer';
import Quiz from './components/Quiz';
import Header from './components/Header';
import Button from './components/Button';
import ProgressGraph from './components/ProgressGraph';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [testScores, setTestScores] = useState<TestResult[]>([]);

  useEffect(() => {
    try {
      const storedScores = localStorage.getItem('testScores');
      if (storedScores) {
        setTestScores(JSON.parse(storedScores));
      }
    } catch (error) {
      console.error("Failed to load test scores from localStorage", error);
    }
  }, []);

  const handleTestComplete = useCallback((score: number, type: 'quiz' | 'flashcard') => {
    setTestScores(prevScores => {
      const newScore: TestResult = {
        score,
        date: new Date().toISOString(),
        type,
      };
      // Keep only the last 10 scores for a clean graph
      const updatedScores = [...prevScores, newScore].slice(-10);
      try {
        localStorage.setItem('testScores', JSON.stringify(updatedScores));
      } catch (error) {
        console.error("Failed to save test scores to localStorage", error);
      }
      return updatedScores;
    });
  }, []);

  const navigateTo = useCallback((view: AppView) => {
    setCurrentView(view);
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case AppView.FLASHCARDS:
        return <FlashcardViewer onBack={() => navigateTo(AppView.HOME)} onTestComplete={(score) => handleTestComplete(score, 'flashcard')} />;
      case AppView.QUIZ:
        return <Quiz onBack={() => navigateTo(AppView.HOME)} onTestComplete={(score) => handleTestComplete(score, 'quiz')} />;
      case AppView.HOME:
      default:
        return (
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 mb-4">Welcome, Future Scientist!</h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Get ready for your NS/TECH exam. Use the flashcards to revise key concepts and then test your knowledge with the quiz. Good luck!
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12">
              <Button onClick={() => navigateTo(AppView.FLASHCARDS)} size="lg">
                Study Flashcards
              </Button>
              <Button onClick={() => navigateTo(AppView.QUIZ)} variant="secondary" size="lg">
                Start Quiz
              </Button>
            </div>
            {testScores.length > 0 && <ProgressGraph scores={testScores} />}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col p-4 sm:p-6 lg:p-8">
      <Header />
      <main className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
