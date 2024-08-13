// QuizPage.tsx
import * as React from 'react';
import { useState } from 'react';
import TrueFalseQuestion from './components/quizzes/TrueFalseQuestion';
import MultipleChoiceQuestion from './components/quizzes/MultipleChoiceQuestion';
import ShortAnswerQuestion from './components/quizzes/ShortAnswerQuestion';
import { Typography, Container, Button } from '@mui/material';

// Define a type for the question types
type QuestionType = 'true-false' | 'multiple-choice' | 'short-answer';

// Update the Question interface
interface Question {
    id: number;
    question: string;
    type: QuestionType;
    correctAnswer: string;
    choices?: string[]; // Only used for multiple-choice questions
}


const questions: Question[] = [
    { id: 1, question: 'The sky is blue.', type: 'true-false', correctAnswer: 'true' },
    { id: 2, question: 'The grass is red.', type: 'true-false', correctAnswer: 'false' },
    { id: 3, question: 'Which color is the sky?', type: 'multiple-choice', correctAnswer: 'Blue', choices: ['Red', 'Green', 'Blue', 'Yellow'] },
    { id: 4, question: 'What is the color of the sun?', type: 'short-answer', correctAnswer: 'Yellow' },
    // Add more questions as needed
];


const QuizPage: React.FC = () => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isQuizCompleted, setIsQuizCompleted] = useState(false);

    const handleAnswer = (isCorrect: boolean) => {
        if (isCorrect) {
            setScore(score + 1);
        }
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < questions.length) {
            setCurrentQuestionIndex(nextIndex);
        } else {
            setIsQuizCompleted(true);
        }
    };

    const handleRestart = () => {
        setCurrentQuestionIndex(0);
        setScore(0);
        setIsQuizCompleted(false);
    };

    const currentQuestion = questions[currentQuestionIndex];

    if (isQuizCompleted) {
        return (
            <Container style={{ textAlign: 'center', padding: 20 }}>
                <Typography variant="h4">Quiz Completed!</Typography>
                <Typography variant="h6">Your Score: {score} / {questions.length}</Typography>
                <Button variant="contained" color="primary" onClick={handleRestart} sx={{ mt: 2 }}>
                    Restart Quiz
                </Button>
            </Container>
        );
    }

    return (
        <Container>
            {currentQuestion.type === 'true-false' ? (
                <TrueFalseQuestion
                    question={currentQuestion.question}
                    correctAnswer={currentQuestion.correctAnswer}
                    onAnswer={handleAnswer}
                />
            ) : currentQuestion.type === 'multiple-choice' ? (
                <MultipleChoiceQuestion
                    question={currentQuestion.question}
                    choices={currentQuestion.choices!} // Non-null assertion
                    correctAnswer={currentQuestion.correctAnswer}
                    onAnswer={handleAnswer}
                />
            ) : currentQuestion.type === 'short-answer' ? (
                <ShortAnswerQuestion
                    question={currentQuestion.question}
                    correctAnswer={currentQuestion.correctAnswer}
                    onAnswer={handleAnswer}
                />
            ) : null}
        </Container>
    );
};

export default QuizPage;
