import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { QuizQuestion, IncorrectAnswer, QuestionReview, Flashcard, UserProfile } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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
  Focus on key terms, definitions, and core concepts appropriate for the ${difficulty} level.`;

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        term: { type: Type.STRING, description: "A descriptive question about the concept" },
        definition: { type: Type.STRING, description: "The answer or definition" },
        options: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "4 distractors including the correct answer if this is a multiple-choice card"
        }
      },
      required: ["term", "definition"]
    }
  };

  const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  }));

  return JSON.parse(response.text.trim());
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

  const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.8,
    },
  }));

  return JSON.parse(response.text.trim());
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

  const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  }));

  return JSON.parse(response.text.trim());
};