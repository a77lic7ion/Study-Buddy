
import React, { useState, useCallback, useEffect } from 'react';
import { AppView, TestResult, UserProfile, User, ApiSettings } from './types';
import FlashcardViewer from './components/FlashcardViewer';
import Quiz from './components/Quiz';
import Header from './components/Header';
import Button from './components/Button';
import ProgressGraph from './components/ProgressGraph';
import SetupView from './components/SetupView';
import AuthView from './components/AuthView';
import ProfileView from './components/ProfileView';
import IntroSequence from './components/IntroSequence';
import ReportCardView from './components/ReportCardView';
import SettingsView from './components/SettingsView';

const DEFAULT_API_SETTINGS: ApiSettings = {
  activeProvider: 'gemini',
  providers: {
    gemini: {
      baseUrl: '',
      apiKey: '',
      selectedModel: 'gemini-3-flash-preview',
      availableModels: ['gemini-3-flash-preview', 'gemini-3-pro-preview']
    },
    mistral: {
      baseUrl: 'https://api.mistral.ai/v1',
      apiKey: '',
      selectedModel: '',
      availableModels: []
    },
    openai: {
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      selectedModel: '',
      availableModels: []
    },
    ollama: {
      baseUrl: 'http://localhost:11434',
      apiKey: '',
      selectedModel: '',
      availableModels: []
    }
  }
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.INTRO);
  const [testScores, setTestScores] = useState<TestResult[]>([]);
  const [apiSettings, setApiSettings] = useState<ApiSettings>(DEFAULT_API_SETTINGS);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [remediationMode, setRemediationMode] = useState(false);

  const getStoredItem = (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`LocalStorage access failed for key: ${key}`, e);
      return null;
    }
  };

  useEffect(() => {
    const storedTheme = getStoredItem('theme');
    const darkMode = storedTheme === null ? true : storedTheme === 'dark';
    setIsDarkMode(darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const hasSeenIntro = getStoredItem('hasSeenIntro');
    const storedUserRaw = getStoredItem('currentUser');
    
    if (storedUserRaw) {
      try {
        const user = JSON.parse(storedUserRaw);
        setCurrentUser(user);
        setCurrentView(user.profile ? AppView.HOME : AppView.SETUP);
      } catch (e) {
        localStorage.removeItem('currentUser');
        setCurrentView(AppView.AUTH);
      }
    } else if (hasSeenIntro) {
      setCurrentView(AppView.AUTH);
    }

    const storedScoresRaw = getStoredItem('testScores');
    if (storedScoresRaw) {
      try {
        setTestScores(JSON.parse(storedScoresRaw));
      } catch (e) {}
    }

    const storedSettingsRaw = getStoredItem('apiSettings');
    if (storedSettingsRaw) {
      try {
        setApiSettings(JSON.parse(storedSettingsRaw));
      } catch (e) {}
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    if (newMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

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
    setCurrentView(AppView.HOME);
  };

  const handleTestComplete = useCallback((score: number) => {
    if (!currentUser || !currentUser.profile) return;
    
    const newScore: TestResult = {
      score,
      date: new Date().toISOString(),
      type: currentView === AppView.QUIZ ? 'quiz' : 'flashcard',
      subject: currentUser.profile.subject,
      grade: currentUser.profile.grade,
      userId: currentUser.id
    };

    setTestScores(prev => {
      const updated = [...prev, newScore];
      localStorage.setItem('testScores', JSON.stringify(updated));
      return updated;
    });
    setRemediationMode(false);
  }, [currentUser, currentView]);

  const handleSaveSettings = (newSettings: ApiSettings) => {
    setApiSettings(newSettings);
    localStorage.setItem('apiSettings', JSON.stringify(newSettings));
  };

  const handleStartRemediation = (type: 'quiz' | 'flashcards') => {
    setRemediationMode(true);
    setCurrentView(type === 'quiz' ? AppView.QUIZ : AppView.FLASHCARDS);
  };

  const userScores = testScores.filter(s => s.userId === currentUser?.id);
  const subjectScores = userScores.filter(s => s.subject === currentUser?.profile?.subject);

  const subjectSummaries = userScores.reduce((acc: any, curr) => {
    if (!acc[curr.subject]) acc[curr.subject] = { total: 0, count: 0, best: 0 };
    acc[curr.subject].total += curr.score;
    acc[curr.subject].count += 1;
    acc[curr.subject].best = Math.max(acc[curr.subject].best, curr.score);
    return acc;
  }, {});

  const renderContent = () => {
    if (currentView === AppView.INTRO) return <IntroSequence onComplete={() => setCurrentView(AppView.AUTH)} />;
    if (currentView === AppView.AUTH) return <AuthView onAuthComplete={handleAuthComplete} />;
    if (!currentUser) return null;

    switch (currentView) {
      case AppView.SETTINGS:
        return <SettingsView settings={apiSettings} onSave={handleSaveSettings} onBack={() => setCurrentView(AppView.HOME)} />;
      case AppView.SETUP:
        return <SetupView onComplete={handleSetupComplete} initialProfile={currentUser.profile} />;
      case AppView.FLASHCARDS:
        return <FlashcardViewer userId={currentUser.id} profile={currentUser.profile!} onBack={() => {setCurrentView(AppView.HOME); setRemediationMode(false);}} onTestComplete={handleTestComplete} isRemediation={remediationMode} />;
      case AppView.QUIZ:
        return <Quiz profile={currentUser.profile!} userId={currentUser.id} onBack={() => {setCurrentView(AppView.HOME); setRemediationMode(false);}} onTestComplete={handleTestComplete} isRemediation={remediationMode} />;
      case AppView.PROFILE:
        return <ProfileView user={currentUser} scores={userScores} onBack={() => setCurrentView(AppView.HOME)} onUpdateUser={(u) => {setCurrentUser(u); localStorage.setItem('currentUser', JSON.stringify(u));}} onOpenReportCard={() => setCurrentView(AppView.REPORT_CARD)} onStartRemediation={handleStartRemediation} />;
      case AppView.REPORT_CARD:
        return <ReportCardView user={currentUser} scores={userScores} onBack={() => setCurrentView(AppView.PROFILE)} />;
      case AppView.HOME:
      default:
        return (
          <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col items-center text-center space-y-4">
              <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter uppercase italic">
                MASTERY <span className="text-primary italic">COMMAND</span>
              </h1>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black text-primary uppercase tracking-[0.2em] shadow-sm">
                  {currentUser.profile?.grade} • {currentUser.profile?.subject}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button onClick={() => setCurrentView(AppView.FLASHCARDS)} className="group relative p-10 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden hover:border-primary/50 transition-all text-left">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-icons-round text-7xl">style</span>
                </div>
                <h3 className="text-2xl font-black uppercase italic mb-3 group-hover:text-primary transition-colors">Neural Reciter</h3>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-xs">Forging deep conceptual recall via AI-synthesized card decks.</p>
                <div className="mt-8 flex items-center text-primary font-black text-[10px] uppercase tracking-[0.3em]">
                  Initialize Forge <span className="material-icons-round ml-2 text-sm">rocket_launch</span>
                </div>
              </button>

              <button onClick={() => setCurrentView(AppView.QUIZ)} className="group relative p-10 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden hover:border-primary/50 transition-all text-left">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-icons-round text-7xl">bolt</span>
                </div>
                <h3 className="text-2xl font-black uppercase italic mb-3 group-hover:text-primary transition-colors">Assessment Lab</h3>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-xs">Simulated environment for real-time proficiency benchmarking.</p>
                <div className="mt-8 flex items-center text-primary font-black text-[10px] uppercase tracking-[0.3em]">
                  Start Simulation <span className="material-icons-round ml-2 text-sm">sensors</span>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                 <ProgressGraph scores={subjectScores.slice(-10)} />
              </div>
              <div className="bg-card border border-border p-8 rounded-2xl shadow-2xl flex flex-col space-y-6">
                <h3 className="text-xs font-black uppercase text-muted-foreground tracking-[0.3em]">Neural Repository</h3>
                <div className="flex flex-col gap-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.keys(subjectSummaries).length > 0 ? Object.keys(subjectSummaries).map(s => {
                    const stats = subjectSummaries[s];
                    const avg = Math.round(stats.total / stats.count);
                    return (
                      <div key={s} className="p-3 bg-secondary/30 rounded-xl border border-border/50 flex justify-between items-center group cursor-pointer hover:bg-primary/5 transition-colors" onClick={() => handleSetupComplete({ ...currentUser.profile!, subject: s })}>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-foreground group-hover:text-primary transition-colors">{s}</span>
                          <span className="text-[8px] text-muted-foreground font-bold">{stats.count} SESSIONS</span>
                        </div>
                        <span className={`text-xs font-black ${avg >= 80 ? 'text-green-500' : 'text-primary'}`}>{avg}%</span>
                      </div>
                    );
                  }) : (
                    <p className="text-[10px] text-muted-foreground font-bold italic py-4">Awaiting first session...</p>
                  )}
                </div>
                <Button onClick={() => setCurrentView(AppView.SETUP)} variant="ghost" className="w-full text-[9px] uppercase tracking-widest py-4 mt-auto">Re-Initialize Target</Button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10 opacity-30 pointer-events-none"></div>
      <Header user={currentUser} onLogout={handleLogout} onProfile={() => setCurrentView(AppView.PROFILE)} onSettings={() => setCurrentView(AppView.SETTINGS)} onHome={() => setCurrentView(AppView.HOME)} showNav={currentView !== AppView.INTRO} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
      <main className="flex-grow flex flex-col px-4 py-8 relative z-0">
        <div className="w-full max-w-6xl mx-auto flex-grow flex items-center justify-center">{renderContent()}</div>
      </main>
      <footer className="w-full py-6 text-center opacity-20">
        <p className="text-[9px] font-black tracking-[0.4em] uppercase">© 2024 NEUROFORGE • FORGING SUPERIOR SCHOLARS</p>
      </footer>
    </div>
  );
};

export default App;
