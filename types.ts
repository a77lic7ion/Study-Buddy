
export interface Flashcard {
  term: string;
  definition: string;
  options?: string[]; // Optional for multiple choice support
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  topic: string;
}

export interface User {
  id: string;
  email: string;
  password?: string; // Only for local simulation
  profile?: UserProfile;
  profileImage?: string; // Base64 encoded image
}

export interface TestResult {
  score: number;
  date: string;
  type: 'quiz' | 'flashcard';
  subject: string;
  grade: string;
  userId: string;
}

export interface IncorrectAnswer {
  question: QuizQuestion;
  userAnswer: string;
}

export interface QuestionReview {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
}

export interface UserProfile {
  grade: string;
  subject: string;
}

export interface ApiProviderConfig {
  baseUrl: string;
  apiKey: string;
  selectedModel: string;
  availableModels: string[];
}

export interface ApiSettings {
  activeProvider: 'gemini' | 'mistral' | 'openai' | 'ollama';
  providers: {
    gemini: ApiProviderConfig;
    mistral: ApiProviderConfig;
    openai: ApiProviderConfig;
    ollama: ApiProviderConfig;
  };
}

export enum AppView {
  INTRO,
  AUTH,
  SETUP,
  HOME,
  FLASHCARDS,
  QUIZ,
  PROFILE,
  REPORT_CARD,
  SETTINGS
}
