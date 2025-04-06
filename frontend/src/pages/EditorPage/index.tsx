import * as React from 'react';
import { Grid } from '@mui/material';  // Change this line, remove Grid2 import
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Snackbar, { SnackbarCloseReason } from '@mui/material/Snackbar';
import { useLocation, useNavigate } from 'react-router-dom';
import { Chip, Typography, Dialog, DialogContent, DialogTitle, Tabs, Tab, Box, CircularProgress } from '@mui/material';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import CodeMirrorMerge from 'react-codemirror-merge';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { useTheme } from '@mui/material/styles';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import { useAuth } from '../../authentication/AuthContext';
import { extract_task } from './utils';
import DialogActions from '@mui/material/DialogActions';

import AIChat from './AIChat';
import EditorView from './EditorView';
import EditorConfig from './EditorConfig';
import ResizablePanel from './ResizablePanel';
import { EditorConfigType, EditorDocType } from './utils';
import { mergeScrollerStyles, leftpanelStyles, dialogStyles, loadingBoxStyles, questionBoxStyles, snackbarAlertStyles, codeMirrorHeight, editorPageStyles } from './styles';

const SUBMIT_API_ENDPOINT = 'http://localhost:8504/submit';
const TASK_API_ENDPOINT = 'http://localhost:8504/generate-task';
const UPDATE_QUESTION_COUNT_ENDPOINT = 'http://localhost:8504/update_question_count';
const LIST_SINGLE_SESSION_API_ENDPOINT = 'http://localhost:8504/list_single_session';

const Original = CodeMirrorMerge.Original;
const Modified = CodeMirrorMerge.Modified;

export default function MainComponent() {
    const [editorConfig, setEditorConfig] = React.useState<EditorConfigType>({
        language: 'combined',
        autoRun: false,
    });
    const [editorDoc, setEditorDoc] = React.useState<EditorDocType>({
        jsDoc: 'Goodbye world',
        htmlDoc: 'Hello world',
        cssDoc: '',
        combinedDoc: 'Hello world\n<style>\n\n</style>\n<script>\nGoodbye world\n</script>',
    });
    const [question, setQuestion] = React.useState('Generating question...');
    const [task, setTask] = React.useState<EditorDocType>({
        jsDoc: 'console.log(\'You can learn anything\');',
        htmlDoc: 'Hello world',
        cssDoc: 'h1 {color: black;text-align: center;}',
        combinedDoc: 'Hello world\n<style>\n\n</style>\n<script>\console.log(\'You can learn anything\')\n</script>',
    });
    const [aiChatWidth, setAiChatWidth] = React.useState<number>(600); // Initial width in pixels
    const [snackbarOpen, setSnackbarOpen] = React.useState(false);
    const [snackbarText, setSnackbarText] = React.useState<string>('');
    const [countdown, setCountdown] = React.useState(1);
    const [showEditor, setShowEditor] = React.useState(false);
    const [tabIndex, setTabIndex] = React.useState(0);

    const [isReadingComplete, setIsReadingComplete] = React.useState<boolean>(false);
    const [cardContent, setCardContent] = React.useState<{ id: number; role: string; question: string; code: string; }[]>([]);
    const [isLoading, setIsLoading] = React.useState<boolean>(false); // New loading state.
    const [dialogOpen, setDialogOpen] = React.useState(false); // New state for dialog
    const [currentQuestionNumber, setCurrentQuestionNumber] = React.useState<number>(1); // New state for question counter

    const location = useLocation();
    const navigate = useNavigate(); // Hook for navigation
    const quiz = location.state?.quiz;

    const { user } = useAuth(); // Accessing user from AuthContext

    const questionRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (quiz) {
            setCountdown(3);
        }
    }, [quiz]);

    React.useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setShowEditor(true);
            generateQuestion();
        }
    }, [countdown]);

    React.useEffect(() => {
        if (questionRef.current) {
            questionRef.current.scrollTop = questionRef.current.scrollHeight;
        }
    }, [question]);

    React.useEffect(() => {
        const fetchSessions = async () => {
            try {
                const response = await fetch(`${LIST_SINGLE_SESSION_API_ENDPOINT}/${quiz.session_id}`, {
                    method: 'GET',
                });
                if (response.ok) {
                    const data = await response.json();
                    setCurrentQuestionNumber(data.current_question_count);
                } else {
                    console.error('Failed to fetch sessions');
                }
            } catch (error) {
                console.error('Error fetching sessions:', error);
            }
        };
        fetchSessions();

        // Listen for the custom event
        const handleCustomEvent = () => {
            fetchSessions();
        };

        window.addEventListener('fetchSessionsEvent', handleCustomEvent);

        return () => {
            window.removeEventListener('fetchSessionsEvent', handleCustomEvent);
        };
    }, []);

    const generateQuestion = async () => {
        try {
            if (!quiz) {
                throw new Error('Quiz object is not available');
            }
            const response = await fetch(TASK_API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: user?._id,
                    session: JSON.stringify(quiz),
                    sessionid: quiz.session_id,
                }) // Serialize the session field
            });
            console.log(response);

            setQuestion("");

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Stream reader is not available');
            }

            const readStream = async () => {
                let { done, value } = await reader.read();
                const chunk = new TextDecoder('utf-8').decode(value);
                setQuestion(prev => prev + chunk);
                await readStream();
            };

            await readStream();
        } catch (error) {
            console.error('Error during stream', error);
        }
    };

    const handleClose = (
        event: React.SyntheticEvent | Event,
        reason?: SnackbarCloseReason,
    ) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    const handleCodeSubmit = async () => {

        setIsLoading(true);
        setIsReadingComplete(false);
        setDialogOpen(true);
        setCardContent([]); // Reset card content before new submission

        try {
            const response = await fetch(`${SUBMIT_API_ENDPOINT}/quiz`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user: user ? user._id : 'test_user',
                    question: question,
                    session: JSON.stringify(quiz),
                    answer: editorDoc.jsDoc,
                }),
            });

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Stream reader is not available');
            }

            let fullMessage = ''; // Store complete message

            const readStream = async () => {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        setIsReadingComplete(true);
                        setIsLoading(false);
                        // Update card content with complete message
                        setCardContent([{
                            id: 1,
                            role: 'assistant',
                            question: fullMessage,
                            code: ''
                        }]);
                        break;
                    }

                    const chunk = new TextDecoder('utf-8').decode(value);
                    fullMessage += chunk;
                }
            };

            await readStream();
        } catch (error) {
            console.error(error);
            setIsLoading(false); // Stop loading on error
        }
    };

    const checkSubmissionResult = async () => {
        // if (!submissionUID) return;
        // try {
        // 	const response = await fetch(`${BACKGROUND_TASK_STATUS_ENDPOINT}/${submissionUID}/status`);
        // 	const json = await response.json();
        // 	console.log(json);
        // 	setSnackbarText(json.status);
        // 	setSnackbarOpen(true);
        // } catch (error) {
        // 	console.error(error);
        // }
    };

    React.useEffect(() => {
        setEditorDoc(task);
    }, [task]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
    };

    const handleNextQuestion = async () => {
        setDialogOpen(false);
        if (currentQuestionNumber <= quiz?.question_count - 1) {
            const newQuestionNumber = currentQuestionNumber + 1;
            setCurrentQuestionNumber(newQuestionNumber);
            try {
                await updateQuestionCount(newQuestionNumber);
                await generateQuestion();
            } catch (error) {
                // Handle failure (e.g., revert state or notify user)
                setCurrentQuestionNumber(currentQuestionNumber);
            }
        } else {
            await updateQuestionCount(quiz?.question_count + 1);
            navigate('/main');
        }
    };

    const updateQuestionCount = async (newQuestionNumber: number) => {
        if (!quiz?.session_id) {
            throw new Error('Invalid session ID');
        }
        try {
            console.log('Sending update:', { session_id: quiz.session_id, current_question_count: newQuestionNumber });
            const response = await fetch(UPDATE_QUESTION_COUNT_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: quiz.session_id,
                    current_question_count: newQuestionNumber,
                }),
            });
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error updating question count:', error);
        }
    };

    if (!showEditor) {
        return (
            <Dialog open>
                <DialogTitle>Are you ready?</DialogTitle>
                <DialogContent>
                    <Typography variant="h1" align="center">{countdown}</Typography>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Box sx={editorPageStyles.root}>
            <Grid container sx={editorPageStyles.mainContainer}>
                {/* Left Panel */}
                <Grid item>  {/* Remove xs prop here */}
                    <ResizablePanel
                        width={aiChatWidth}
                        onWidthChange={setAiChatWidth}
                        minWidth={300}
                        maxWidth={1000}
                    >
                        <Box sx={editorPageStyles.leftPanel}>
                            <Alert severity="info">
                                <AlertTitle><strong>Quiz: {quiz?.name}</strong></AlertTitle>
                                <Typography variant="body1">
                                    Question Count: {currentQuestionNumber} of {quiz?.question_count}
                                </Typography>
                            </Alert>

                            <Tabs value={tabIndex} onChange={handleTabChange}>
                                <Tab label="Question" />
                                <Tab label="AI Chat" />
                            </Tabs>

                            {tabIndex === 0 && (
                                <Card variant="outlined" sx={editorPageStyles.questionCard}>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        sx={editorPageStyles.startButton}
                                        onClick={() => {
                                            console.log('Start Coding button clicked' + question);
                                            const [jsCode, htmlCode, cssCode] = extract_task(question);
                                            setTask({
                                                jsDoc: jsCode,
                                                htmlDoc: htmlCode,
                                                cssDoc: cssCode,
                                                combinedDoc: question
                                            });
                                        }}
                                    >
                                        Start Coding
                                    </Button>
                                    <CardContent sx={editorPageStyles.questionContent}>
                                        <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
                                            Question number {currentQuestionNumber}
                                        </Typography>
                                        <Typography sx={{ color: 'text.secondary', mb: 1.5, margin: '0px' }}>
                                            Topics:
                                            {quiz?.topics.map((topic: string, index: number) => (
                                                <Chip
                                                    key={index}
                                                    label={topic}
                                                    size="small"
                                                    sx={{ mr: 0.5, mb: 0.5 }}
                                                />
                                            ))}
                                        </Typography>
                                        <Box ref={questionRef} sx={editorPageStyles.questionContent}>
                                            <MarkdownRenderer content={question || "Loading Question..."} />
                                        </Box>
                                    </CardContent>
                                </Card>
                            )}

                            {tabIndex === 1 && (
                                <AIChat
                                    question={question}
                                    setQuestion={setQuestion}
                                    task={task}
                                    setTask={setTask}
                                    quiz={quiz}
                                />
                            )}
                        </Box>
                    </ResizablePanel>
                </Grid>

                {/* Right Panel */}
                <Grid
                    item
                    xs={true}
                    sx={editorPageStyles.rightPanel}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <EditorConfig
                            editorConfig={editorConfig}
                            editorDoc={editorDoc}
                            setEditorConfig={setEditorConfig}
                            handleCodeSubmit={handleCodeSubmit}
                            checkSubmissionResult={checkSubmissionResult}
                        />
                        <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
                            <EditorView
                                editorConfig={editorConfig}
                                editorDoc={editorDoc}
                                setEditorDoc={setEditorDoc}
                            />
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {/* Keep your existing Snackbar and Dialog components */}
            <Snackbar open={snackbarOpen} sx={{ left: '100px !important' }} autoHideDuration={6000} onClose={handleClose}>
                <Alert
                    onClose={handleClose}
                    severity="warning"
                    variant="filled"
                    sx={snackbarAlertStyles}
                >
                    {snackbarText}
                </Alert>
            </Snackbar>

            <Dialog
                open={dialogOpen}
                onClose={() => { }}
                disableEscapeKeyDown
                maxWidth={false}
                PaperProps={{ sx: dialogStyles.paper }}
            >
                <DialogTitle>Submission Result</DialogTitle>
                <DialogContent>
                    {isLoading ? (
                        <Box sx={loadingBoxStyles}>
                            <CircularProgress /><br></br>
                            <Typography variant="body2" sx={{ ml: 2 }}><br></br>Analyzing your Answer...</Typography>
                        </Box>
                    ) : (
                        cardContent.map((card) => (
                            <div key={card.id}>
                                <Typography variant="body1" gutterBottom>
                                    {card.question.split('```')[0]} {/* Display text explanation */}
                                </Typography>
                                <Box sx={mergeScrollerStyles}>
                                    <CodeMirrorMerge
                                        orientation="a-b"
                                        theme={useTheme().palette.mode === 'light' ? githubLight : githubDark}
                                    >
                                        <Original
                                            value={`${editorDoc.htmlDoc}\n<style>\n${editorDoc.cssDoc}\n</style>\n<script>\n${editorDoc.jsDoc}\n</script>`}
                                            extensions={[javascript({ jsx: true }), html(), css()]}
                                        />
                                        <Modified
                                            value={card.question.split('```')[1] || ''}
                                            extensions={[markdown({ base: markdownLanguage, codeLanguages: languages })]}
                                        />
                                    </CodeMirrorMerge>
                                </Box>
                            </div>
                        ))
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleNextQuestion} color="primary">
                        Next Question
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

function useEffect(arg0: () => () => void, arg1: never[]) {
    throw new Error('Function not implemented.');
}

