import React, { useState, useCallback, useEffect } from 'react';
import { AppView, TestResult, UserProfile, User } from './types';
import FlashcardViewer from './components/FlashcardViewer';
import Quiz from './components/Quiz';
import Header from './components/Header';
import Button from './components/Button';
import ProgressGraph from './components/ProgressGraph';
import SetupView from './components/SetupView';
import AuthView from './components/AuthView';
import ProfileView from './components/ProfileView';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.AUTH);
  const [testScores, setTestScores] = useState<TestResult[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setCurrentView(user.profile ? AppView.HOME : AppView.SETUP);
    }

    const storedScores = localStorage.getItem('testScores');
    if (storedScores) setTestScores(JSON.parse(storedScores));
  }, []);

  const handleAuthComplete = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentView(user.profile ? AppView.HOME : AppView.SETUP);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setCurrentView(AppView.AUTH);
  };

  const handleSetupComplete = (profile: UserProfile) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, profile };
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // Update users "database"
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex((u: User) => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem('users', JSON.stringify(users));
    }

    setCurrentView(AppView.HOME);
  };

  const handleTestComplete = useCallback((score: number, type: 'quiz' | 'flashcard') => {
    if (!currentUser || !currentUser.profile) return;
    
    const newScore: TestResult = {
      score,
      date: new Date().toISOString(),
      type,
      subject: currentUser.profile.subject,
      grade: currentUser.profile.grade,
      userId: currentUser.id
    };

    setTestScores(prev => {
      const updated = [...prev, newScore];
      localStorage.setItem('testScores', JSON.stringify(updated));
      return updated;
    });
  }, [currentUser]);

  const userScores = testScores.filter(s => s.userId === currentUser?.id);
  const subjectScores = userScores.filter(s => s.subject === currentUser?.profile?.subject);

  const renderContent = () => {
    if (currentView === AppView.AUTH) {
      return <AuthView onAuthComplete={handleAuthComplete} />;
    }

    if (!currentUser) return null;

    switch (currentView) {
      case AppView.SETUP:
        return <SetupView onComplete={handleSetupComplete} initialProfile={currentUser.profile} />;
      case AppView.FLASHCARDS:
        return <FlashcardViewer userId={currentUser.id} profile={currentUser.profile!} onBack={() => setCurrentView(AppView.HOME)} onTestComplete={(s) => handleTestComplete(s, 'flashcard')} />;
      case AppView.QUIZ:
        return <Quiz profile={currentUser.profile!} userId={currentUser.id} onBack={() => setCurrentView(AppView.HOME)} onTestComplete={(s) => handleTestComplete(s, 'quiz')} />;
      case AppView.PROFILE:
        return <ProfileView user={currentUser} scores={userScores} onBack={() => setCurrentView(AppView.HOME)} />;
      case AppView.HOME:
      default:
        return (
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 mb-2 drop-shadow-lg">Master Your Studies</h1>
            <p className="text-xl text-slate-400 mb-8 uppercase tracking-widest font-light">
              {currentUser.profile?.grade} • {currentUser.profile?.subject}
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12">
              <Button onClick={() => setCurrentView(AppView.FLASHCARDS)} size="lg" className="w-full sm:w-64 py-5 shadow-2xl">
                AI Flashcards
              </Button>
              <Button onClick={() => setCurrentView(AppView.QUIZ)} variant="secondary" size="lg" className="w-full sm:w-64 py-5 shadow-2xl">
                Adaptive Quiz
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <ProgressGraph scores={subjectScores.slice(-10)} />
               <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col justify-center items-center space-y-4 shadow-xl">
                  <h3 className="text-xl font-bold text-slate-200">Session Controls</h3>
                  <Button onClick={() => setCurrentView(AppView.PROFILE)} variant="primary" className="w-full">Dashboard & Analytics</Button>
                  <Button onClick={() => setCurrentView(AppView.SETUP)} variant="ghost" className="w-full">Change Subject</Button>
               </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col p-4 sm:p-6 lg:p-8">
      <Header 
        profile={currentUser?.profile} 
        onLogout={handleLogout} 
        onProfile={() => setCurrentView(AppView.PROFILE)} 
        onHome={() => setCurrentView(AppView.HOME)}
        showNav={currentView !== AppView.AUTH}
      />
      <main className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-5xl mx-auto py-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;