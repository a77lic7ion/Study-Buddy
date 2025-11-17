export interface Flashcard {
  term: string;
  definition: string;
  symbol?: string; // For visual representation of circuit symbols
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  topic: string; // To enable adaptive learning
}

export interface TestResult {
  score: number; // Percentage
  date: string; // ISO string date
  type: 'quiz' | 'flashcard';
}

// New type for tracking incorrect answers
export interface IncorrectAnswer {
  question: QuizQuestion;
  userAnswer: string;
}

// New type for the generated review
export interface QuestionReview {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
}


export enum AppView {
  HOME,
  FLASHCARDS,
  QUIZ,
}
