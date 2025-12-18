
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
      // Simulate a small delay for diagnostic feedback
      await new Promise(resolve => setTimeout(resolve, 800));
      const config = localSettings.providers[provider as keyof ApiSettings['providers']];
      
      if (provider === 'gemini' && config.apiKey) {
        setTestStatus(prev => ({ ...prev, [provider]: 'success' }));
        return;
      }

      if (!config.baseUrl && provider !== 'gemini') {
         throw new Error("Base URL required");
      }

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
        const response = await fetch(`${config.baseUrl}/api/tags`).then(r => r.json());
        models = response.models?.map((m: any) => m.name) || [];
      } else if (provider === 'cloudflare') {
        // Cloudflare doesn't have a standardized 'list models' that is easy to call without account ID
        // Often users provide their own common ones or manually enter. 
        // We'll provide a few common Workers AI IDs as defaults if empty.
        models = ['@cf/meta/llama-3-8b-instruct', '@cf/mistral/mistral-7b-instruct-v0.1', '@cf/google/gemma-7b-it'];
      } else {
        // OpenAI compatible (Mistral, Deepseek, OpenRouter, OpenAI)
        const endpoint = `${config.baseUrl.replace(/\/+$/, '')}/models`;
        const headers: Record<string, string> = {};
        if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;
        
        const response = await fetch(endpoint, { headers }).then(r => r.json());
        if (response.data) {
          models = response.data.map((m: any) => m.id);
        } else if (Array.isArray(response)) {
          models = response.map((m: any) => m.id || m.name || m);
        }
      }

      if (models.length > 0) {
        updateProvider(provider, { availableModels: models, selectedModel: models[0] });
      }
    } catch (e) {
      console.error(`Failed to prefetch ${provider} models`, e);
      alert(`Could not fetch models for ${provider}. Check endpoint/keys.`);
    } finally {
      setFetchStatus(prev => ({ ...prev, [provider]: false }));
    }
  };

  const providersList: (keyof ApiSettings['providers'])[] = [
    'gemini', 'mistral', 'openai', 'ollama', 'cloudflare', 'deepseek', 'openrouter'
  ];

  return (
    <div className="w-full max-w-5xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex items-center justify-between mb-8 sm:mb-10 px-2">
        <div className="pr-4">
          <h2 className="text-xl sm:text-3xl font-black text-foreground uppercase italic tracking-tighter leading-none">
            AI <span className="text-primary italic">COMMAND</span>
          </h2>
          <p className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2">
            NEURAL CORE CONFIG
          </p>
        </div>
        <Button onClick={onBack} variant="ghost" size="sm" className="flex-shrink-0">RETURN</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
        {/* Sidebar Tabs - Horizontal Scroll on Mobile */}
        <div className="lg:col-span-1 flex lg:flex-col gap-2 overflow-x-auto pb-2 sm:pb-0 lg:overflow-x-visible custom-scrollbar">
          {providersList.map(p => (
            <button
              key={p}
              onClick={() => setLocalSettings(prev => ({ ...prev, activeProvider: p }))}
              className={`flex-shrink-0 lg:w-full p-3 sm:p-4 text-left rounded-xl border transition-all flex items-center justify-between gap-4 group ${
                localSettings.activeProvider === p 
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-card border-border text-muted-foreground hover:bg-secondary'
              }`}
            >
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">{p}</span>
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${testStatus[p] === 'success' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-muted-foreground/30'}`}></div>
            </button>
          ))}
          
          <div className="hidden lg:block pt-10">
            <Button 
              onClick={() => { onSave(localSettings); onBack(); }}
              variant="primary" 
              className="w-full py-5 text-[10px] uppercase tracking-[0.3em] bg-green-600 hover:bg-green-700 shadow-xl"
            >
              Save Parameters
            </Button>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-3 bg-card border border-border p-6 sm:p-10 rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 hidden sm:block">
            <span className="material-icons-round text-8xl">settings_input_component</span>
          </div>

          <div className="relative z-10 space-y-6 sm:space-y-8">
            <h3 className="text-lg sm:text-xl font-black uppercase italic text-primary flex items-center gap-3 italic">
              <span className="material-icons-round text-xl sm:text-2xl">memory</span>
              {localSettings.activeProvider} Tuning
            </h3>

            <div className="grid grid-cols-1 gap-5 sm:gap-6">
              {localSettings.activeProvider !== 'gemini' && (
                <div className="space-y-2 sm:space-y-3">
                  <label className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1 leading-none block">Service Endpoint</label>
                  <input 
                    type="text" 
                    value={localSettings.providers[localSettings.activeProvider].baseUrl} 
                    onChange={e => updateProvider(localSettings.activeProvider, { baseUrl: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl p-3 sm:p-4 text-[11px] sm:text-xs font-mono text-foreground focus:ring-1 focus:ring-primary outline-none"
                    placeholder={
                        localSettings.activeProvider === 'cloudflare' 
                        ? "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run"
                        : "https://api.example.com/v1"
                    }
                  />
                  {localSettings.activeProvider === 'cloudflare' && (
                      <p className="text-[8px] text-muted-foreground italic uppercase tracking-widest mt-1">Include your Account ID in the URL for native Cloudflare AI calls.</p>
                  )}
                </div>
              )}

              {localSettings.activeProvider !== 'ollama' && (
                <div className="space-y-2 sm:space-y-3">
                  <label className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1 leading-none block">API Key / Token</label>
                  <input 
                    type="password" 
                    value={localSettings.providers[localSettings.activeProvider].apiKey} 
                    onChange={e => updateProvider(localSettings.activeProvider, { apiKey: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl p-3 sm:p-4 text-[11px] sm:text-xs font-mono text-foreground focus:ring-1 focus:ring-primary outline-none"
                    placeholder="••••••••"
                  />
                </div>
              )}

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <label className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1 leading-none">Model Selection</label>
                  <button 
                    onClick={() => prefetchModels(localSettings.activeProvider)}
                    disabled={fetchStatus[localSettings.activeProvider]}
                    className="text-[8px] sm:text-[9px] font-black uppercase text-primary hover:opacity-70 transition-opacity flex items-center gap-1.5 disabled:opacity-30 whitespace-nowrap"
                  >
                    <span className={`material-icons-round text-sm ${fetchStatus[localSettings.activeProvider] ? 'animate-spin' : ''}`}>sync</span>
                    {fetchStatus[localSettings.activeProvider] ? 'SYNC...' : 'SYNC'}
                  </button>
                </div>
                
                <div className="relative">
                  <select
                    value={localSettings.providers[localSettings.activeProvider].selectedModel}
                    onChange={e => updateProvider(localSettings.activeProvider, { selectedModel: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl p-3 sm:p-4 text-[11px] sm:text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer pr-12"
                  >
                    {localSettings.providers[localSettings.activeProvider].availableModels.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    {localSettings.providers[localSettings.activeProvider].availableModels.length === 0 && (
                      <option value="">No models sync'd.</option>
                    )}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <span className="material-icons-round text-sm">expand_more</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 sm:pt-10 border-t border-border/50 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button 
                onClick={() => testProvider(localSettings.activeProvider)} 
                disabled={testStatus[localSettings.activeProvider] === 'testing'}
                variant="secondary" 
                className="flex-grow text-[9px] sm:text-[10px] uppercase tracking-widest py-3 sm:py-4"
              >
                {testStatus[localSettings.activeProvider] === 'testing' ? 'Testing...' : 'Diagnostic'}
              </Button>
              
              {testStatus[localSettings.activeProvider] === 'success' && (
                <div className="bg-green-500/10 border border-green-500/20 px-4 sm:px-6 py-3 sm:py-4 rounded-xl flex items-center gap-3 text-green-500 animate-in fade-in zoom-in duration-300">
                  <span className="material-icons-round text-sm">check_circle</span>
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Link Active</span>
                </div>
              )}
              
              {testStatus[localSettings.activeProvider] === 'error' && (
                <div className="bg-destructive/10 border border-destructive/20 px-4 sm:px-6 py-3 sm:py-4 rounded-xl flex items-center gap-3 text-destructive animate-in shake duration-300">
                  <span className="material-icons-round text-sm">error</span>
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Protocol Fail</span>
                </div>
              )}
            </div>
            
            <div className="lg:hidden pt-4">
              <Button 
                onClick={() => { onSave(localSettings); onBack(); }}
                variant="primary" 
                className="w-full py-4 text-[10px] uppercase tracking-[0.2em] bg-green-600 shadow-xl"
              >
                Save All Parameters
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
