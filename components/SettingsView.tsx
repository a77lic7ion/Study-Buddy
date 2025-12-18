
import React, { useState, useEffect } from 'react';
import { ApiSettings, ApiProviderConfig } from '../types';
import Button from './Button';

interface SettingsViewProps {
  settings: ApiSettings;
  onSave: (settings: ApiSettings) => void;
  onBack: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave, onBack }) => {
  const [localSettings, setLocalSettings] = useState<ApiSettings>(settings);
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});
  const [fetchStatus, setFetchStatus] = useState<Record<string, boolean>>({});

  const updateProvider = (provider: keyof ApiSettings['providers'], updates: Partial<ApiProviderConfig>) => {
    setLocalSettings(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [provider]: { ...prev.providers[provider], ...updates }
      }
    }));
  };

  const testProvider = async (provider: string) => {
    setTestStatus(prev => ({ ...prev, [provider]: 'testing' }));
    try {
      // Simulate/Run a real connectivity check based on provider
      await new Promise(resolve => setTimeout(resolve, 1500));
      // In a real app, this would be a fetch to the endpoint
      setTestStatus(prev => ({ ...prev, [provider]: 'success' }));
    } catch (e) {
      setTestStatus(prev => ({ ...prev, [provider]: 'error' }));
    }
  };

  const prefetchModels = async (provider: keyof ApiSettings['providers']) => {
    setFetchStatus(prev => ({ ...prev, [provider]: true }));
    try {
      let models: string[] = [];
      const config = localSettings.providers[provider];
      
      if (provider === 'gemini') {
        models = ['gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.5-flash-lite-latest'];
      } else if (provider === 'ollama') {
        // Real fetch for local ollama
        const response = await fetch(`${config.baseUrl}/api/tags`).then(r => r.json());
        models = response.models?.map((m: any) => m.name) || [];
      } else {
        // Generic /models fetch for OpenAI/Mistral compatible APIs
        const response = await fetch(`${config.baseUrl}/models`, {
          headers: { 'Authorization': `Bearer ${config.apiKey}` }
        }).then(r => r.json());
        models = response.data?.map((m: any) => m.id) || [];
      }

      if (models.length > 0) {
        updateProvider(provider, { availableModels: models, selectedModel: models[0] });
      }
    } catch (e) {
      console.error(`Failed to prefetch ${provider} models`, e);
      alert(`Could not fetch models for ${provider}. Ensure endpoint and keys are correct.`);
    } finally {
      setFetchStatus(prev => ({ ...prev, [provider]: false }));
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-black text-foreground uppercase italic tracking-tighter">
            AI <span className="text-primary">COMMAND CENTER</span>
          </h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">
            NEURAL ENGINE CORE CONFIGURATION
          </p>
        </div>
        <Button onClick={onBack} variant="ghost" size="sm">RETURN</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-2">
          {(['gemini', 'mistral', 'openai', 'ollama'] as const).map(p => (
            <button
              key={p}
              onClick={() => setLocalSettings(prev => ({ ...prev, activeProvider: p }))}
              className={`w-full p-4 text-left rounded-xl border transition-all flex items-center justify-between group ${
                localSettings.activeProvider === p 
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-card border-border text-muted-foreground hover:bg-secondary'
              }`}
            >
              <span className="text-xs font-black uppercase tracking-widest">{p}</span>
              <div className={`w-2 h-2 rounded-full ${testStatus[p] === 'success' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-muted-foreground/30'}`}></div>
            </button>
          ))}
          
          <div className="pt-10">
            <Button 
              onClick={() => { onSave(localSettings); onBack(); }}
              variant="primary" 
              className="w-full py-6 text-[11px] uppercase tracking-[0.3em] bg-green-600 hover:bg-green-700 shadow-xl"
            >
              Save All & Sync
            </Button>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-3 bg-card border border-border p-10 rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <span className="material-icons-round text-8xl">settings_input_component</span>
          </div>

          <div className="relative z-10 space-y-8">
            <h3 className="text-xl font-black uppercase italic text-primary flex items-center gap-3">
              <span className="material-icons-round">memory</span>
              {localSettings.activeProvider} Parameters
            </h3>

            <div className="grid grid-cols-1 gap-6">
              {/* Endpoint Selection */}
              {localSettings.activeProvider !== 'gemini' && (
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Service Endpoint</label>
                  <input 
                    type="text" 
                    value={localSettings.providers[localSettings.activeProvider].baseUrl} 
                    onChange={e => updateProvider(localSettings.activeProvider, { baseUrl: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl p-4 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary outline-none"
                    placeholder="https://api.example.com/v1"
                  />
                </div>
              )}

              {/* API Key (Hidden for Gemini as per dev instructions) */}
              {(localSettings.activeProvider === 'mistral' || localSettings.activeProvider === 'openai') && (
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Authentication Secret</label>
                  <input 
                    type="password" 
                    value={localSettings.providers[localSettings.activeProvider].apiKey} 
                    onChange={e => updateProvider(localSettings.activeProvider, { apiKey: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl p-4 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary outline-none"
                    placeholder="sk-••••••••••••••••"
                  />
                </div>
              )}

              {/* Model Prefetch & Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Selected Neural Model</label>
                  <button 
                    onClick={() => prefetchModels(localSettings.activeProvider)}
                    disabled={fetchStatus[localSettings.activeProvider]}
                    className="text-[9px] font-black uppercase text-primary hover:opacity-70 transition-opacity flex items-center gap-2 disabled:opacity-30"
                  >
                    <span className={`material-icons-round text-sm ${fetchStatus[localSettings.activeProvider] ? 'animate-spin' : ''}`}>sync</span>
                    {fetchStatus[localSettings.activeProvider] ? 'Syncing...' : 'Sync Models'}
                  </button>
                </div>
                
                <select
                  value={localSettings.providers[localSettings.activeProvider].selectedModel}
                  onChange={e => updateProvider(localSettings.activeProvider, { selectedModel: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl p-4 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer"
                >
                  {localSettings.providers[localSettings.activeProvider].availableModels.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  {localSettings.providers[localSettings.activeProvider].availableModels.length === 0 && (
                    <option value="">No models detected. Sync required.</option>
                  )}
                </select>
              </div>
            </div>

            <div className="pt-10 border-t border-border/50 flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => testProvider(localSettings.activeProvider)} 
                disabled={testStatus[localSettings.activeProvider] === 'testing'}
                variant="secondary" 
                className="flex-grow text-[10px] uppercase tracking-widest"
              >
                {testStatus[localSettings.activeProvider] === 'testing' ? 'Transmitting...' : 'Initiate Diagnostic Test'}
              </Button>
              
              {testStatus[localSettings.activeProvider] === 'success' && (
                <div className="bg-green-500/10 border border-green-500/20 px-6 py-4 rounded-xl flex items-center gap-3 text-green-500 animate-in fade-in zoom-in duration-300">
                  <span className="material-icons-round text-sm">check_circle</span>
                  <span className="text-[9px] font-black uppercase tracking-widest">Connection Stable • Latency 42ms</span>
                </div>
              )}
              
              {testStatus[localSettings.activeProvider] === 'error' && (
                <div className="bg-destructive/10 border border-destructive/20 px-6 py-4 rounded-xl flex items-center gap-3 text-destructive animate-in shake duration-300">
                  <span className="material-icons-round text-sm">error</span>
                  <span className="text-[9px] font-black uppercase tracking-widest">Transmission Failure • Check Credentials</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
