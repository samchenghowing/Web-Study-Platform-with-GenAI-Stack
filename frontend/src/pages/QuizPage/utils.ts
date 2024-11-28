export type QuestionType = 'true-false' | 'multiple-choice' | 'short-answer' | 'coding';

export type Question = {
    id: number;
    question: string;
    type: QuestionType;
    correctAnswer: string;
    choices?: string[]; // Only used for multiple-choice questions
    isLanding: boolean;
    onAnswer: (isCorrect: boolean) => void;
};
