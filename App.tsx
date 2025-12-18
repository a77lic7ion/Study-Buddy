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
          <div className="w-full max-w-4xl mx-auto space-y-12 animate-in fade-in zoom-in duration-500">
            <div className="text-center relative">
              <h1 className="text-4xl md:text-6xl font-black text-foreground mb-4 tracking-tighter">
                MASTER YOUR <span className="text-primary">STUDIES</span>
              </h1>
              <div className="flex justify-center items-center gap-3">
                <span className="px-3 py-1 bg-secondary border border-border rounded-md text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {currentUser.profile?.grade}
                </span>
                <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-md text-xs font-bold text-primary uppercase tracking-widest">
                  {currentUser.profile?.subject}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button 
                onClick={() => setCurrentView(AppView.FLASHCARDS)}
                className="group relative p-8 bg-card border border-border rounded-lg shadow-2xl overflow-hidden hover:border-primary/50 transition-all text-left"
              >
                <div className="absolute top-0 right-0 p-4 text-primary/20 group-hover:text-primary/40 transition-colors">
                  <span className="material-icons-round text-6xl">style</span>
                </div>
                <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">AI Flashcards</h3>
                <p className="text-sm text-muted-foreground">Dynamic revision decks powered by Gemini AI.</p>
                <div className="mt-6 flex items-center text-primary font-bold text-xs uppercase tracking-widest">
                  Launch Module <span className="material-icons-round ml-2 text-sm">arrow_forward</span>
                </div>
              </button>

              <button 
                onClick={() => setCurrentView(AppView.QUIZ)}
                className="group relative p-8 bg-card border border-border rounded-lg shadow-2xl overflow-hidden hover:border-primary/50 transition-all text-left"
              >
                <div className="absolute top-0 right-0 p-4 text-primary/20 group-hover:text-primary/40 transition-colors">
                  <span className="material-icons-round text-6xl">quiz</span>
                </div>
                <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">Adaptive Quiz</h3>
                <p className="text-sm text-muted-foreground">Real-time assessment that learns from your mistakes.</p>
                <div className="mt-6 flex items-center text-primary font-bold text-xs uppercase tracking-widest">
                  Begin Test <span className="material-icons-round ml-2 text-sm">arrow_forward</span>
                </div>
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                 <ProgressGraph scores={subjectScores.slice(-8)} />
              </div>
              <div className="bg-card border border-border p-8 rounded-lg shadow-2xl flex flex-col justify-center space-y-4">
                <h3 className="text-lg font-bold text-foreground">Scholar Hub</h3>
                <Button onClick={() => setCurrentView(AppView.PROFILE)} variant="secondary" className="w-full justify-start gap-3">
                  <span className="material-icons-round text-sm">analytics</span>
                  Analytics Dashboard
                </Button>
                <Button onClick={() => setCurrentView(AppView.SETUP)} variant="ghost" className="w-full justify-start gap-3">
                  <span className="material-icons-round text-sm">settings</span>
                  Update Target
                </Button>
                <div className="pt-4 border-t border-border mt-4">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">System Status</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs text-foreground font-medium">AI Engine Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      {/* Decorative Blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10 opacity-40 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      <Header 
        profile={currentUser?.profile} 
        onLogout={handleLogout} 
        onProfile={() => setCurrentView(AppView.PROFILE)} 
        onHome={() => setCurrentView(AppView.HOME)}
        showNav={currentView !== AppView.AUTH}
      />
      
      <main className="flex-grow flex flex-col px-4 py-12 relative z-0">
        <div className="w-full max-w-6xl mx-auto flex-grow flex items-center justify-center">
          {renderContent()}
        </div>
      </main>

      <footer className="w-full py-6 text-center z-10 opacity-30">
        <p className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] uppercase">© 2024 STUDYBUDDY AI • NEURAL ASSESSMENT ENGINE</p>
      </footer>
    </div>
  );
};

export default App;