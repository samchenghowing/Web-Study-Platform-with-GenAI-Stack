// QuizPage.tsx
import * as React from 'react';
import { useState } from 'react';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import ShortAnswerQuestion from './ShortAnswerQuestion';
import CodingQuestion from './CodingQuestion';
import AvatarChoice from './AvatarChoice';
import DropdownQuestion from './DropdownQuestion';
import { Question } from './utils';
import { Typography, Container, Button, Stepper, Step, StepLabel, Card, CardContent, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom'; // Import Link and useNavigate
import { useAuth } from '../../authentication/AuthContext';
import logoimg from '../src/title.png'; // Adjust the path as necessary
import travelimg from '../src/travel.jpeg'
import MarkdownRenderer from '../../components/MarkdownRenderer';

const QUIZ_API_ENDPOINT = 'http://localhost:8504/quiz';
const SESSION_API_ENDPOINT = 'http://localhost:8504/get_QUIZsession';
const CHECK_NEWSTUDENT_API_ENDPOINT = 'http://localhost:8504/check_new_student';
const QUIZ_PROGRESS_API = 'http://localhost:8504/quiz-progress';

const QuizPage: React.FC = () => {

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isQuizCompleted, setIsQuizCompleted] = useState(false);
    const [questions, setQuestions] = React.useState<Question[]>([]);
    const [hasSelectedAvatar, setHasSelectedAvatar] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    const [question, setQuestion] = React.useState('.');
    const [isLoading, setIsLoading] = useState(true);

    const questionRef = React.useRef<HTMLDivElement>(null);

    // TODO: Generate questions by prompting user's answer and textbook content
    // Save the created session in db, real time generation
    

    React.useEffect(() => {
        const fetchStudentAndProgress = async () => {
            if (!user?._id) {
                console.log('No user ID available');
                return;
            }

            try {
                setIsLoading(true);
                console.log('Fetching quiz progress for user:', user._id);

                // Fetch questions
                console.log('Fetching questions...');
                const questionsResponse = await fetch(`${QUIZ_API_ENDPOINT}/${user._id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                });
                const json = await questionsResponse.json();
                console.log('Questions loaded:', json.questions.length);
                setQuestions(json.questions);

                // Fetch progress
                console.log('Fetching quiz progress...');
                const progressResponse = await fetch(`${QUIZ_PROGRESS_API}/${user._id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                });

                if (!progressResponse.ok) {
                    throw new Error(`Progress fetch failed: ${progressResponse.status} ${progressResponse.statusText}`);
                }

                const progressData = await progressResponse.json();
                console.log('Progress data:', progressData);

                // Update currentQuestionIndex and check completion
                const savedIndex = progressData.currentIndex || 0;
                if (savedIndex >= 5 ) { // json.questions.length
                    setIsQuizCompleted(true);
                } else {
                    setCurrentQuestionIndex(savedIndex); // Resume from saved index
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                if (error instanceof Error) {
                    console.error('Error details:', error.message);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudentAndProgress();
    }, [user?._id, navigate]);

    const handleAnswer = async (isCorrect: boolean) => {
        if (isCorrect) {
            setScore(score + 1);
        }
        
        const nextIndex = currentQuestionIndex + 1;
        
        try {
            await fetch(`http://localhost:8504/quiz-progress/${user?._id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentIndex: nextIndex,
                })
            });

            if (nextIndex < questions.length) {
                setCurrentQuestionIndex(nextIndex);
            } else {
                setIsQuizCompleted(true);
            }
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    };

    const currentQuestion = questions[currentQuestionIndex];

    React.useEffect(() => {
        if (currentQuestion?.type.toLowerCase() === 'suggestions') {
            generateLp();
        }
    }, [currentQuestion]);

    React.useEffect(() => {
        if (questionRef.current) {
            questionRef.current.scrollTop = questionRef.current.scrollHeight;
        }
    }, [question]);

    /**
     * Displays a completion message
     * Provides a button to navigate to /main/editor
     */

    if (isQuizCompleted) {
        return (
            <Container
                sx={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center', // Center vertically
                    alignItems: 'center', // Center horizontally
                    overflow: 'hidden',
                    textAlign: 'left' // Change text alignment
                }}
            >
                {/* Top-left Logo */}
                <div style={{ position: 'absolute', top: 16, left: 16 }}>
                    <img
                        src={logoimg}
                        alt="logo of WebGenie"
                        style={{ width: '200px', height: 'auto' }}
                    />
                </div>

                {/* GIF Animation
                <div style={{ marginBottom: '20px' }}>
                    <img
                        src={travelimg}
                        alt="Start Journey Animation"
                        style={{
                            width: '100px',
                            height: 'auto',
                        }}
                    />
                </div>

                {/* Start Your Journey Text *
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 'bold',
                        marginBottom: '20px',
                        color: '#3b82f6',
                    }}
                >
                    We are good to go!
                </Typography> */}

                {/* Avatar Selection */}
                <Box sx={{ width: '100%', maxWidth: 600, mb: 4 }}>
                    <AvatarChoice onComplete={() => setHasSelectedAvatar(true)} />
                </Box>

                {/* Start Button - Only show when avatar is selected */}
                {hasSelectedAvatar && (
                <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    to="/main/lib"
                    size="large"
                    sx={{
                    background: '#ffffff',
                    color: '#3b82f6',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    fontFamily: '"Roboto", sans-serif',
                    padding: '10px 20px',
                    '&:hover': {
                        backgroundColor: '#f0f7ff',
                    },
                    }}
                >
                    Start your journey
                </Button>
                )}
            </Container>
        );

    }

    const generateLp = async () => {
        try {
            const latest_session = await fetch(`http://localhost:8504/get_QUIZsession/${user?._id}`, {
                method: 'GET',
            });
            if (latest_session.ok) {
                const session = await latest_session.json();
                const response = await fetch('http://localhost:8504/generate-learning-preference', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user: user?._id, session: JSON.stringify(session) })
                });
                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error('Stream reader is not available');
                }
                const readStream = async () => {
                    let { done, value } = await reader.read();
                    if (done) return;

                    const chunk = new TextDecoder('utf-8').decode(value);
                    setQuestion(prev => prev + chunk);
                    await readStream();
                };

                await readStream();
            }
        } catch (error) {
            console.error('Error during stream', error);
        }
    };

    if (questions.length == 0) {
        return (
            <Container>
                <div style={{ position: 'absolute', top: 16, left: 16 }}>
                    <img src={logoimg} alt="logo of WebGenie" style={{ width: '200px', height: 'auto' }} />
                </div>
                <Typography variant="h4" sx={{ fontWeight: 'bold', marginBottom: '20px', color: '#3b82f6' }}>
                    No questions available. Quiz may be completed or not yet initialized.{currentQuestionIndex}
                </Typography>
            </Container>
        );
    }

    /**
     * Shows a error message while fetching questions
     */

    if (!currentQuestion) {
        return (
            <Container>
                {/* Top-left Logo */}
                <div style={{ position: 'absolute', top: 16, left: 16 }}>
                    <img
                        src={logoimg}
                        alt="logo of WebGenie"
                        style={{ width: '200px', height: 'auto', flexGrow: 2 }}
                    />
                </div>
                {/* Start Your Journey Text */}
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 'bold',
                        marginBottom: '20px',
                        color: '#3b82f6',
                    }}
                >
                    Error: No questions available.
                </Typography>

            </Container>
        );
    }

    /**
     * CreateSessionDialog.tsx: Session management
     * Stepper: Visualizes the user's progress (display progress through a sequence of logical and numbered steps.)
     */

    return (

        <Container
            sx={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                textAlign: 'left' // Change text alignment
            }}>
            {/* Top-left Logo */}
            <div style={{ position: 'absolute', top: 16, left: 16 }}>
                <img
                    src={logoimg}
                    alt="logo of WebGenie"
                    style={{ width: '200px', height: 'auto', flexGrow: 2 }}
                />
            </div>

            {/* Stepper Section - Fixed Height */}
            <div style={{
                width: '80%',
                margin: '0 auto',
                marginTop: '80px', /* Adds space below the logo */
                marginBottom: '24px',
                height: '80px', /* Fixed height for the Stepper */
                flexShrink: 0, /* Prevent resizing */
                display: 'flex',
                alignItems: 'center'
            }}>
                <Stepper activeStep={currentQuestionIndex} alternativeLabel style={{ width: '100%' }}>
                    {questions.map((_, index) => (
                        <Step key={index}>
                            <StepLabel>{`Question ${index + 1}`}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </div>

            {/* Centered Content */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                overflow: 'hidden', /* Ensures no extra scrolling */
                flexGrow: 1
            }}>

                {/* Question Rendering */}
                <div style={{ textAlign: 'left', width: '80%' }}> {/* Change text alignment */}
                    {currentQuestion.type === 'multiple-choice' ? (
                        <MultipleChoiceQuestion
                            question={currentQuestion.question}
                            choices={currentQuestion.choices || []}
                            correctAnswer={currentQuestion.correctAnswer}
                            isLanding={currentQuestion.isLanding}
                            onAnswer={handleAnswer}
                        />
                    ) : currentQuestion.type === 'dropdownquestion' ? (
                        <DropdownQuestion
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
                            isLanding={currentQuestion.isLanding}
                            onAnswer={handleAnswer}
                        />
                    ) : currentQuestion.type === 'coding' ? (
                        <CodingQuestion
                            question={currentQuestion.question}
                            codeEval={currentQuestion.correctAnswer}
                            onAnswer={handleAnswer}
                        />
                    ) : currentQuestion.type === 'Suggestions' ? (
                        <>
                            <Typography variant="h6" gutterBottom>
                                5-step learning path to learn HTML, CSS, and JavaScript!
                            </Typography>

                            {/* add auto scrolling here when the markdown content exceed the length of the page */}
                            <Card style={{ maxHeight: '60vh', overflowY: 'auto' }} ref={questionRef}>
                                <CardContent>
                                    <MarkdownRenderer content={question} />
                                </CardContent>
                            </Card>

                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => handleAnswer(true)}
                                sx={{ mt: 2 }}
                            >
                                Next Question
                            </Button>
                        </>

                    ) : null}
                </div>
            </div>
        </Container>

    );
};


export default QuizPage;
