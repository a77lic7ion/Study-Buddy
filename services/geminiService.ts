import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { QuizQuestion, IncorrectAnswer, QuestionReview, Flashcard, UserProfile, ApiSettings, ApiProviderConfig } from '../types';

// Default Gemini AI instance using system key
const getGeminiAI = (apiKey?: string) => new GoogleGenAI({ apiKey: apiKey || (process.env.API_KEY as string) });

const getStoredSettings = (): ApiSettings | null => {
  const saved = localStorage.getItem('apiSettings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  }
  return null;
};

const updateActiveProvider = (newProvider: keyof ApiSettings['providers']) => {
  const settings = getStoredSettings();
  if (settings) {
    settings.activeProvider = newProvider;
    localStorage.setItem('apiSettings', JSON.stringify(settings));
    // Dispatch event to notify UI components if necessary
    window.dispatchEvent(new CustomEvent('neuroforge:provider_switched', { detail: { provider: newProvider } }));
  }
};

/**
 * Attempts a single AI request for a specific provider
 */
const executeProviderRequest = async (provider: keyof ApiSettings['providers'], config: ApiProviderConfig, prompt: string, schema: any): Promise<any> => {
  if (provider === 'gemini') {
    const ai = getGeminiAI(config.apiKey);
    const model = config.selectedModel || "gemini-3-flash-preview";

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    return JSON.parse(response.text.trim());
  } else {
    if (!config.baseUrl) {
      throw new Error(`Configuration missing: Base URL required for ${provider}`);
    }

    const isOllama = provider === 'ollama';
    const isCloudflare = provider === 'cloudflare';
    
    let endpoint = config.baseUrl;
    if (isOllama) {
      endpoint = `${config.baseUrl}/api/generate`;
    } else if (isCloudflare) {
      endpoint = `${config.baseUrl}/${config.selectedModel}`;
    } else if (!endpoint.endsWith('/chat/completions')) {
      endpoint = `${endpoint.replace(/\/+$/, '')}/chat/completions`;
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const enhancedPrompt = `${prompt}\n\nIMPORTANT: You MUST respond strictly with valid JSON that matches this schema: ${JSON.stringify(schema)}. Do not include any markdown formatting or extra text. Output ONLY the JSON.`;

    let body: any;
    if (isOllama) {
      body = { model: config.selectedModel, prompt: enhancedPrompt, stream: false, format: "json" };
    } else if (isCloudflare) {
      body = { prompt: enhancedPrompt };
    } else {
      body = {
        model: config.selectedModel,
        messages: [{ role: 'user', content: enhancedPrompt }],
        response_format: { type: "json_object" }
      };
    }

    const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI Provider Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    let resultString = "";
    if (isOllama) {
      resultString = data.response;
    } else if (isCloudflare) {
      resultString = data.result?.response || data.response || "";
    } else {
      resultString = data.choices?.[0]?.message?.content || "";
    }

    const jsonMatch = resultString.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    const finalString = jsonMatch ? jsonMatch[0] : resultString;
    return JSON.parse(finalString.trim());
  }
};

/**
 * Orchestrates AI requests with automatic failover capabilities
 */
const requestAI = async (prompt: string, schema: any): Promise<any> => {
  const settings = getStoredSettings();
  const activeProvider = settings?.activeProvider || 'gemini';
  const failoverEnabled = settings?.automaticFailover ?? true;

  // 1. Try Primary Provider
  try {
    const config = settings?.providers[activeProvider];
    if (config) {
      return await executeProviderRequest(activeProvider, config, prompt, schema);
    }
  } catch (error: any) {
    console.warn(`Primary AI Provider (${activeProvider}) failed:`, error.message);
    
    if (!failoverEnabled) throw error;

    // 2. Identify available fallback providers (those with at least basic config)
    const providerKeys: (keyof ApiSettings['providers'])[] = ['gemini', 'mistral', 'openai', 'ollama', 'cloudflare', 'deepseek', 'openrouter'];
    const fallbacks = providerKeys.filter(p => {
      if (p === activeProvider) return false;
      const cfg = settings?.providers[p];
      if (!cfg) return false;
      // Gemini needs an API key OR we use the system one
      if (p === 'gemini') return true; 
      // Others need a Base URL
      return !!cfg.baseUrl;
    });

    // 3. Cycle through fallbacks
    for (const fallback of fallbacks) {
      try {
        console.log(`Initiating Neural Failover to: ${fallback}...`);
        const result = await executeProviderRequest(fallback, settings!.providers[fallback], prompt, schema);
        
        // Success! Update active provider for future requests
        updateActiveProvider(fallback);
        return result;
      } catch (fallbackError: any) {
        console.warn(`Fallback AI Provider (${fallback}) failed:`, fallbackError.message);
      }
    }

    // If we reach here, all providers failed
    throw new Error("Neural Link Offline: All AI providers exhausted or misconfigured.");
  }
};

export const generateFlashcards = async (profile: UserProfile, difficulty: string = 'Medium', count: number = 10, isRemediation: boolean = false, weakTopics: string[] = []): Promise<Flashcard[]> => {
  let mcLogic = "";
  if (difficulty === 'Easy') {
    mcLogic = "Every single flashcard MUST include 4 multiple-choice 'options' (one of which is the correct 'definition').";
  } else if (difficulty === 'Medium') {
    mcLogic = "Approximately 50% of the flashcards MUST include 4 multiple-choice 'options' (one of which is the correct 'definition'). The rest should not have options.";
  } else if (difficulty === 'Hard') {
    mcLogic = "Only a few flashcards (about 2 or 3) should include multiple-choice 'options'. Most should rely on pure recall.";
  }

  const basePrompt = isRemediation 
    ? `NEURAL RESTORATION PROTOCOL: Create ${count} remediation flashcards for ${profile.grade} ${profile.subject}. 
       FOCUS TOPICS (Failed Concepts): ${weakTopics.join(', ')}.
       CRITICAL INSTRUCTION: Reword these concepts into entirely new scenarios, contexts, and wordings. 
       Use real-world applications or unusual examples to ensure they understand the deep principle, not just the words.`
    : `Generate a set of ${count} high-quality educational flashcards for a student in ${profile.grade} studying ${profile.subject}. DIFFICULTY LEVEL: ${difficulty}.`;

  const prompt = `${basePrompt} 
  ${mcLogic}
  IMPORTANT: The "term" property should be a full, descriptive question.
  Include an "explanation" field for every card that provides a concise, insightful breakdown of the concept (2-3 sentences).`;

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        term: { type: Type.STRING },
        definition: { type: Type.STRING },
        explanation: { type: Type.STRING },
        options: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["term", "definition", "explanation"]
    }
  };

  return requestAI(prompt, schema);
};

export const generateQuizQuestions = async (profile: UserProfile, weakTopics: string[] = [], focusTopics: string[] = [], count: number = 10, isRemediation: boolean = false): Promise<QuizQuestion[]> => {
  const basePrompt = isRemediation
    ? `REMEDIATION SIMULATION: Generate ${count} challenging multiple-choice questions for ${profile.grade} ${profile.subject}.
       CORE WEAKNESSES: ${weakTopics.join(', ')}.
       MANDATORY: Transform these concepts. Reword and re-contextualize so they cannot answer based on visual memory of previous questions.`
    : `Generate a ${count}-question multiple-choice quiz for a ${profile.grade} student studying ${profile.subject}.
       ${focusTopics.length > 0 ? `USER SPECIFIC FOCUS: Heavily prioritize these specific topics: ${focusTopics.join(', ')}.` : `ADAPTIVE LEARNING: Focus on weak areas: ${weakTopics.join(', ') || 'None'}.`}`;

  const prompt = `${basePrompt}
    Each question must have 4 options and 1 correct answer.
    The "topic" field should be a concise category for the question.
  `;

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        options: { type: Type.ARRAY, items: { type: Type.STRING } },
        correctAnswer: { type: Type.STRING },
        topic: { type: Type.STRING }
      },
      required: ["question", "options", "correctAnswer", "topic"]
    }
  };

  return requestAI(prompt, schema);
};

export const generateReview = async (incorrectAnswers: IncorrectAnswer[], profile: UserProfile): Promise<QuestionReview[]> => {
  const prompt = `
    Provide encouraging educational feedback for a ${profile.grade} student who got these ${profile.subject} questions wrong.
    Explain the concepts simply.
    Questions: ${JSON.stringify(incorrectAnswers.map(ia => ({ q: ia.question.question, ua: ia.userAnswer, ca: ia.question.correctAnswer })))}
  `;

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        userAnswer: { type: Type.STRING },
        correctAnswer: { type: Type.STRING },
        explanation: { type: Type.STRING }
      },
      required: ["question", "userAnswer", "correctAnswer", "explanation"]
    }
  };

  return requestAI(prompt, schema);
};