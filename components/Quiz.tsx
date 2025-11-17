import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { QuizQuestion, IncorrectAnswer, QuestionReview } from '../types';
import { generateQuizQuestions, generateReview } from '../services/geminiService';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { playCorrectSound, playIncorrectSound } from '../utils/soundUtils';

interface QuizProps {
  onBack: () => void;
  onTestComplete: (score: number) => void;
}

type QuizStatus = 'not_started' | 'loading' | 'in_progress' | 'completed' | 'generating_review' | 'review';
const WEAK_TOPICS_KEY = 'weakTopics';

const renderWithSVG = (text: string) => {
    if (typeof text !== 'string' || !text.includes('<svg')) {
      return text;
    }
    const parts = text.split(/(<svg[\s\S]*?<\/svg>)/g);
    return (
      <span className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
        {parts.map((part, index) => {
          if (part.startsWith('<svg')) {
            const styledPart = part.replace('<svg', '<svg class="inline-block align-middle h-10 w-24 text-white"');
            return <span key={index} dangerouslySetInnerHTML={{ __html: styledPart }} />;
          }
          return part;
        })}
      </span>
    );
};

const Quiz: React.FC<QuizProps> = ({ onBack, onTestComplete }) => {
  const [status, setStatus] = useState<QuizStatus>('not_started');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState<IncorrectAnswer[]>([]);
  const [reviewData, setReviewData] = useState<QuestionReview[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const weakTopics = useMemo(() => {
    try {
      const storedTopics = localStorage.getItem(WEAK_TOPICS_KEY);
      return storedTopics ? JSON.parse(storedTopics) : [];
    } catch {
      return [];
    }
  }, [status]); // Reread topics when a new quiz starts

  const startQuiz = useCallback(async () => {
    setStatus('loading');
    setError(null);
    setIncorrectAnswers([]);
    setReviewData(null);
    try {
      const generatedQuestions = await generateQuizQuestions(weakTopics);
      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setStatus('in_progress');
    } catch (err) {
      setError('Failed to generate the quiz. Please try again.');
      setStatus('not_started');
      console.error(err);
    }
  }, [weakTopics]);
  
  useEffect(() => {
    const handleQuizCompletion = async () => {
      if (status === 'completed' && questions.length > 0) {
        const percentage = Math.round((score / questions.length) * 100);
        onTestComplete(percentage);

        // Update weak topics based on this quiz's results
        const newWeakTopics = incorrectAnswers.map(ia => ia.question.topic);
        const updatedTopics = [...weakTopics, ...newWeakTopics].slice(-10); // Keep last 10 weak topics
        localStorage.setItem(WEAK_TOPICS_KEY, JSON.stringify(updatedTopics));

        setStatus('generating_review');
      }
    };
    handleQuizCompletion();
  }, [status, score, questions.length, onTestComplete, incorrectAnswers, weakTopics]);

  useEffect(() => {
    const fetchReview = async () => {
      if (status === 'generating_review') {
        if (incorrectAnswers.length > 0) {
          const review = await generateReview(incorrectAnswers);
          setReviewData(review);
        }
        setStatus('review');
      }
    };
    fetchReview();
  }, [status, incorrectAnswers]);

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer) return;

    setSelectedAnswer(answer);
    const question = questions[currentQuestionIndex];
    const correct = answer === question.correctAnswer;
    
    if (correct) {
      playCorrectSound();
      setScore(prev => prev + 1);
    } else {
      playIncorrectSound();
      setIncorrectAnswers(prev => [...prev, { question, userAnswer: answer }]);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setStatus('completed');
    }
  };

  const getButtonClass = (option: string) => {
    if (!selectedAnswer) return 'bg-slate-700 hover:bg-slate-600';
    
    const isCorrectAnswer = option === questions[currentQuestionIndex].correctAnswer;
    const isSelectedAnswer = option === selectedAnswer;

    if (isCorrectAnswer) return 'bg-green-600 text-white ring-2 ring-green-400';
    if (isSelectedAnswer) return 'bg-red-600 text-white'; // Incorrect selection
    
    return 'bg-slate-700 opacity-50 cursor-not-allowed';
  };

  if (status === 'loading') {
    return (
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-lg text-slate-300">Generating your personalized quiz...</p>
      </div>
    );
  }

  if (status === 'generating_review') {
    return (
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-lg text-slate-300">Analyzing your answers and preparing feedback...</p>
      </div>
    );
  }
  
  if (status === 'review' || status === 'completed') {
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div className="text-center bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-4 text-cyan-400">Quiz Complete!</h2>
        <p className="text-xl mb-2 text-slate-200">Your Score:</p>
        <p className="text-6xl font-bold mb-6 text-white">{percentage}%</p>
        <p className="text-lg text-slate-300 mb-8">You answered {score} out of {questions.length} questions correctly.</p>

        {reviewData && reviewData.length > 0 && (
          <div className="mt-10 text-left">
            <h3 className="text-2xl font-bold mb-6 text-cyan-400 text-center">Let's Review Your Answers</h3>
            <div className="space-y-6">
              {reviewData.map((item, index) => (
                <div key={index} className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                  <p className="font-semibold text-lg mb-2 text-slate-200">{renderWithSVG(item.question)}</p>
                  <p className="text-red-400 mb-1 pl-4 border-l-4 border-red-400">Your answer: {renderWithSVG(item.userAnswer)}</p>
                  <p className="text-green-400 mb-3 pl-4 border-l-4 border-green-400">Correct answer: {renderWithSVG(item.correctAnswer)}</p>
                  <div className="bg-slate-800 p-3 rounded-md">
                    <p className="text-cyan-300 font-bold text-sm">💡 Explanation</p>
                    <p className="text-slate-300">{item.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {incorrectAnswers.length === 0 && (
             <p className="text-2xl font-bold text-green-400 my-8">🎉 Congratulations, you got a perfect score! 🎉</p>
        )}

        <div className="flex gap-4 justify-center mt-10">
          <Button onClick={startQuiz}>Take a New Quiz</Button>
          <Button onClick={onBack} variant="ghost">Back to Home</Button>
        </div>
      </div>
    );
  }


  if (status === 'in_progress') {
    const question = questions[currentQuestionIndex];
    return (
      <div className="bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl w-full">
        <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold text-cyan-400">Question {currentQuestionIndex + 1} of {questions.length}</p>
                <p className="text-sm font-semibold text-slate-300">Score: {score}</p>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
            </div>
        </div>
        <div className="text-xl md:text-2xl font-bold mb-6 text-slate-100 whitespace-pre-wrap">{renderWithSVG(question.question)}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {question.options.map((option) => (
            <button
              key={option}
              onClick={() => handleAnswerSelect(option)}
              disabled={!!selectedAnswer}
              className={`p-4 rounded-lg text-left transition-all duration-200 w-full ${getButtonClass(option)}`}
            >
              {renderWithSVG(option)}
            </button>
          ))}
        </div>
        {selectedAnswer && (
          <div className="text-right">
            <Button onClick={nextQuestion}>
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish & Review'}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-4 text-slate-200">Ready to Test Your Knowledge?</h2>
      <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">A personalized 10-question quiz will be generated, focusing on topics you've found tricky before.</p>
      {error && <p className="text-red-400 mb-4">{error}</p>}
      <div className="flex gap-4 justify-center">
        <Button onClick={startQuiz} size="lg">Generate Quiz</Button>
        <Button onClick={onBack} variant="ghost">Back to Home</Button>
      </div>
    </div>
  );
};

export default Quiz;