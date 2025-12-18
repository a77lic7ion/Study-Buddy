import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { QuizQuestion, IncorrectAnswer, QuestionReview, Flashcard, UserProfile, ApiSettings } from '../types';

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

const withRetry = async <T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(res => setTimeout(res, delay));
      return withRetry(fn, retries - 1, delay * 2);
    } else {
      throw error;
    }
  }
};

/**
 * Orchestrates AI requests across different providers.
 * If Gemini is selected, it uses the official SDK with structured output.
 * For others, it uses fetch to communicate with OpenAI-compatible or Ollama endpoints.
 */
const requestAI = async (prompt: string, schema: any): Promise<any> => {
  const settings = getStoredSettings();
  const activeProvider = settings?.activeProvider || 'gemini';
  const config = settings?.providers[activeProvider];

  if (activeProvider === 'gemini') {
    const ai = getGeminiAI(config?.apiKey);
    const model = config?.selectedModel || "gemini-3-flash-preview";

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    }));

    return JSON.parse(response.text.trim());
  } else {
    // Non-Gemini providers (Ollama, OpenAI, Mistral)
    if (!config || !config.baseUrl) {
      throw new Error(`Configuration missing for provider: ${activeProvider}`);
    }

    const isOllama = activeProvider === 'ollama';
    const endpoint = isOllama 
      ? `${config.baseUrl}/api/generate` 
      : `${config.baseUrl}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    // Enhance prompt to enforce JSON structure for providers without native schema support
    const enhancedPrompt = `${prompt}\n\nIMPORTANT: You MUST respond strictly with valid JSON that matches this schema: ${JSON.stringify(schema)}. Do not include any markdown formatting or extra text.`;

    const body: any = isOllama ? {
      model: config.selectedModel,
      prompt: enhancedPrompt,
      stream: false,
      format: "json"
    } : {
      model: config.selectedModel,
      messages: [{ role: 'user', content: enhancedPrompt }],
      response_format: { type: "json_object" }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI Provider Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    
    // Parse result based on common API response structures
    let resultString = "";
    if (isOllama) {
      resultString = data.response;
    } else {
      resultString = data.choices?.[0]?.message?.content || "";
    }

    return JSON.parse(resultString.trim());
  }
};

export const generateFlashcards = async (profile: UserProfile, difficulty: string = 'Medium', count: number = 10): Promise<Flashcard[]> => {
  let mcLogic = "";
  if (difficulty === 'Easy') {
    mcLogic = "Every single flashcard MUST include 4 multiple-choice 'options' (one of which is the correct 'definition').";
  } else if (difficulty === 'Medium') {
    mcLogic = "Approximately 50% of the flashcards MUST include 4 multiple-choice 'options' (one of which is the correct 'definition'). The rest should not have options.";
  } else if (difficulty === 'Hard') {
    mcLogic = "Only a few flashcards (about 2 or 3) should include multiple-choice 'options'. Most should rely on pure recall.";
  }

  const prompt = `Generate a set of ${count} high-quality educational flashcards for a student in ${profile.grade} studying ${profile.subject}. 
  DIFFICULTY LEVEL: ${difficulty}. 
  ${mcLogic}
  The content should align with standard school curriculums. 
  IMPORTANT: The "term" property should be a full, descriptive question.
  For cards with "options", ensure the "definition" matches exactly one of the options.
  Include an "explanation" field for every card that provides a concise, insightful breakdown of the concept (2-3 sentences).
  Focus on key terms, definitions, and core concepts appropriate for the ${difficulty} level.`;

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        term: { type: Type.STRING },
        definition: { type: Type.STRING },
        explanation: { type: Type.STRING },
        options: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING }
        }
      },
      required: ["term", "definition", "explanation"]
    }
  };

  return requestAI(prompt, schema);
};

export const generateQuizQuestions = async (profile: UserProfile, weakTopics: string[] = [], focusTopics: string[] = [], count: number = 10): Promise<QuizQuestion[]> => {
  const focusContext = focusTopics.length > 0 
    ? `USER SPECIFIC FOCUS: Heavily prioritize these specific topics: ${focusTopics.join(', ')}.` 
    : `ADAPTIVE LEARNING: Focus 60-70% of questions on these weak areas if provided: ${weakTopics.join(', ') || 'None'}.`;

  const prompt = `
    Generate a ${count}-question multiple-choice quiz for a ${profile.grade} student studying ${profile.subject}.
    Include varied difficulty levels.
    ${focusContext}
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