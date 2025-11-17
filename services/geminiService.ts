// FIX: Import GenerateContentResponse to correctly type the API response.
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { QuizQuestion, IncorrectAnswer, QuestionReview } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Helper function for retrying API calls with exponential backoff
const withRetry = async <T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> => {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0) {
            console.warn(`API call failed, retrying in ${delay}ms... (${retries} retries left)`);
            await new Promise(res => setTimeout(res, delay));
            return withRetry(fn, retries - 1, delay * 2); // Double the delay for next retry
        } else {
            console.error("API call failed after multiple retries.", error);
            throw error; // Rethrow the error after all retries have failed
        }
    }
};


export const generateQuizQuestions = async (weakTopics: string[] = []): Promise<QuizQuestion[]> => {
  const prompt = `
    Generate a new and unique 10-question multiple-choice quiz for a Grade 6 student studying for their year-end NS/TECH exam.
    The curriculum is the CAPS SA Curriculum 2025.
    The difficulty of the questions should be varied, including very easy, easy, medium, hard, and very hard questions to properly assess the student's knowledge.
    Each question must have 4 options, and one correct answer must be specified.
    Each question must be assigned a topic from the curriculum list below.

    The questions should cover a range of the following topics, ensuring variety:
    - Electric Circuits
    - Electrical Conductors and Insulators
    - Mains Electricity and Safety
    - Renewable Energy
    - The Solar System
    - Earth and Moon Movement
    - Space Exploration Technology

    Where relevant, include SVG string representations of the electrical symbols in the questions or options. For example, for a question asking to identify a symbol, one of the options could be a string containing: '<svg width="100" height="40" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" stroke="white"><line x1="0" y1="20" x2="35" y2="20" stroke-width="2"/><line x1="35" y1="5" x2="35" y2="35" stroke-width="2"/><line x1="45" y1="10" x2="45" y2="30" stroke-width="2"/><line x1="45" y1="20" x2="100" y2="20" stroke-width="2"/></svg>'

    ADAPTIVE LEARNING INSTRUCTIONS:
    A list of the student's weak topics is provided below. Please focus a higher proportion of the 10 questions (around 60-70%) on these topics. For these weak topics, ask rephrased or different styles of questions to help the student understand the concept from a new angle.
    Weak Topics: ${weakTopics.length > 0 ? weakTopics.join(', ') : 'None'}

    Ensure the questions are appropriate for a Grade 6 level, are worded differently from previous requests, and are clear and unambiguous.
  `;

  const quizSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        question: {
          type: Type.STRING,
          description: "The quiz question."
        },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "An array of 4 possible answers. May include SVG strings for symbols."
        },
        correctAnswer: {
          type: Type.STRING,
          description: "The correct answer, which must be one of the strings from the 'options' array."
        },
        topic: {
          type: Type.STRING,
          description: "The specific curriculum topic for this question (e.g., 'Electric Circuits')."
        }
      },
      required: ["question", "options", "correctAnswer", "topic"]
    }
  };

  try {
    const apiCall = () => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizSchema,
        temperature: 0.8, // Lowered for more predictable, structured output
      },
    });

    // FIX: Explicitly type the response to avoid 'unknown' type from withRetry, resolving property 'text' does not exist error.
    const response: GenerateContentResponse = await withRetry(apiCall);

    const jsonText = response.text.trim();
    const quizData = JSON.parse(jsonText);

    if (!Array.isArray(quizData) || quizData.length === 0) {
        throw new Error("API returned invalid or empty quiz data.");
    }
    return quizData as QuizQuestion[];
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    throw new Error("Failed to communicate with the Gemini API. Please check your connection and try again.");
  }
};

export const generateReview = async (incorrectAnswers: IncorrectAnswer[]): Promise<QuestionReview[]> => {
  if (incorrectAnswers.length === 0) {
    return [];
  }

  const prompt = `
    A Grade 6 student has just completed a science quiz and answered the following questions incorrectly.
    For each question provided below, generate a clear, simple, and encouraging explanation for why the correct answer is right.
    The explanation should be easy for a 12-year-old to understand. The goal is to help them learn from their mistakes.
    Structure the response as a JSON array, where each object contains the original question, the user's answer, the correct answer, and your explanation.

    Here are the questions they got wrong:
    ${incorrectAnswers.map((item, index) => `
      Item ${index + 1}:
      - Question: "${item.question.question}"
      - Their Answer: "${item.userAnswer}"
      - Correct Answer: "${item.question.correctAnswer}"
    `).join('')}
  `;

  const reviewSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        userAnswer: { type: Type.STRING },
        correctAnswer: { type: Type.STRING },
        explanation: { 
          type: Type.STRING,
          description: "A simple explanation of the correct answer, aimed at a Grade 6 student."
        }
      },
      required: ["question", "userAnswer", "correctAnswer", "explanation"]
    }
  };

  try {
    const apiCall = () => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: reviewSchema,
        temperature: 0.5,
      },
    });

    // FIX: Explicitly type the response to avoid 'unknown' type from withRetry, resolving property 'text' does not exist error.
    const response: GenerateContentResponse = await withRetry(apiCall);

    const jsonText = response.text.trim();
    const reviewData = JSON.parse(jsonText);

    if (!Array.isArray(reviewData)) {
      throw new Error("API returned invalid review data.");
    }
    return reviewData as QuestionReview[];

  } catch (error) {
    console.error("Error generating review:", error);
    // Fallback in case of API error
    return incorrectAnswers.map(ia => ({
      question: ia.question.question,
      userAnswer: ia.userAnswer,
      correctAnswer: ia.question.correctAnswer,
      explanation: "Sorry, we couldn't generate an explanation for this answer. Please review the topic in your study materials."
    }));
  }
};