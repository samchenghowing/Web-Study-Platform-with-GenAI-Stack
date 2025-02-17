export type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer' | 'coding' | 'dropdownquestion' | 'Suggestions';
export type Question = {
    id: number;
    question: string;
    type: QuestionType;
    correctAnswer: string;
    choices?: string[]; // Only used for multiple-choice questions
    isLanding: boolean;
    onAnswer: (isCorrect: boolean) => void;
};
