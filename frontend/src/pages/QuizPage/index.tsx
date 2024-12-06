// QuizPage.tsx
import * as React from 'react';
import { useState } from 'react';
import TrueFalseQuestion from './TrueFalseQuestion';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import ShortAnswerQuestion from './ShortAnswerQuestion';
import CodingQuestion from './CodingQuestion';
import { Typography, Container, Button, Stepper, Step, StepLabel } from '@mui/material';
import { Link } from 'react-router-dom'; // Import Link
import { useAuth } from '../../authentication/AuthContext';
import { Question } from './utils';
import CreateSessionDialog from './CreateSessionDialog'

const QUIZ_API_ENDPOINT = 'http://localhost:8504/quiz';
const SESSION_API_ENDPOINT = 'http://localhost:8504/get_session';
const CHECK_NEWSTUDENT_API_ENDPOINT = 'http://localhost:8504/check_new_student';

const QuizPage: React.FC = () => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isQuizCompleted, setIsQuizCompleted] = useState(false);
    const [questions, setQuestions] = React.useState<Question[]>([]);
    const { user } = useAuth();

    // TODO: Generate questions by prompting user's answer and textbook content
    // Save the created session in db, real time generation
    React.useEffect(() => {
        const abortController = new AbortController();
        const fetchStudent = async () => {
            try {
                const response = await fetch(`${CHECK_NEWSTUDENT_API_ENDPOINT}/${user?._id}`, {
                    signal: abortController.signal
                });
                const student = await response.json();
                if (student.is_new) {
                    // get user's login first, if login = 0, get landing quiz
                    fetchQuestions();
                }
                else {
                    fetchSession();
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error(error);
                }
            }
        };

        const fetchQuestions = async () => {
            try {
                const response = await fetch(`${QUIZ_API_ENDPOINT}/${user?._id}`, {
                    signal: abortController.signal
                });
                const json = await response.json();
                setQuestions(json.questions);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error(error);
                }
            }
        };

        const fetchSession = async () => {
            try {
                const response = await fetch(`${SESSION_API_ENDPOINT}/${user?._id}`, {
                    signal: abortController.signal
                });
                const json = await response.json();
                console.log(json)
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error(error);
                }
            }
        };

        fetchStudent();
        return () => abortController.abort();
    }, []);

    const handleAnswer = async (isCorrect: boolean) => {
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

    const currentQuestion = questions[currentQuestionIndex];

    if (isQuizCompleted) {
        return (
            <Container style={{ textAlign: 'center', padding: 20 }}>
                <Typography variant="h4">We are good to go!</Typography>
                {/* <Typography variant="h6">Your Score: {score} / {questions.length}</Typography> */}
                <Button variant="contained" color="primary" component={Link} to="/main/editor" sx={{ mt: 2 }}>
                    Start your journey
                </Button>
            </Container>
        );
    }

    if (questions.length === 0) {
        return (
            <Container>
                <Typography variant="h6">Loading questions...</Typography>
            </Container>
        );
    }

    if (!currentQuestion) {
        return (
            <Container>
                <Typography variant="h6">Error: No questions available.</Typography>
            </Container>
        );
    }

    return (
        <Container>
            <CreateSessionDialog></CreateSessionDialog>
            {/* If new user => landing session */}

            {/* else => get existing session/ create new session */}

            {/* Stepper Component */}
            <Stepper activeStep={currentQuestionIndex} alternativeLabel>
                {questions.map((_, index) => (
                    <Step key={index}>
                        <StepLabel>{`Question ${index + 1}`}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {/* Question Rendering */}
            {currentQuestion.type === 'true-false' ? (
                <TrueFalseQuestion
                    question={currentQuestion.question}
                    correctAnswer={currentQuestion.correctAnswer}
                    onAnswer={handleAnswer}
                />
            ) : currentQuestion.type === 'multiple-choice' ? (
                <MultipleChoiceQuestion
                    question={currentQuestion.question}
                    choices={currentQuestion.choices || []}
                    correctAnswer={currentQuestion.correctAnswer}
                    isLanding={currentQuestion.isLanding}
                    onAnswer={handleAnswer}
                />
            ) : currentQuestion.type === 'short-answer' ? (
                <ShortAnswerQuestion
                    question={currentQuestion.question}
                    correctAnswer={currentQuestion.correctAnswer}
                    onAnswer={handleAnswer}
                />
            ) : currentQuestion.type === 'coding' ? (
                <CodingQuestion
                    question={currentQuestion.question}
                    codeEval={currentQuestion.correctAnswer}
                    onAnswer={handleAnswer}
                />
            ) : null}
        </Container>
    );
};

export default QuizPage;
