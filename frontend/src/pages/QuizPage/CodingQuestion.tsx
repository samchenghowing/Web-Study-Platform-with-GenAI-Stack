import * as React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import CodeMirrorMerge from 'react-codemirror-merge';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { useTheme } from '@mui/material/styles';
import CardContent from '@mui/material/CardContent';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import { Button, Typography, Snackbar, CircularProgress, Box } from '@mui/material';
import { useAuth } from '../../authentication/AuthContext';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';

const SUBMIT_API_ENDPOINT = 'http://localhost:8504/submit';

const Original = CodeMirrorMerge.Original;
const Modified = CodeMirrorMerge.Modified;

interface CodingQuestionProps {
    question: string;
    codeEval: string;
    onAnswer: (isCorrect: boolean) => void;
}

interface CardContentType {
    id: number;
    role: string;
    question: string;
    code: string;
}

export function InfoCard({ data, value, InfoCardProps }) {
    return (
        <CardContent>
            <Typography component={'span'} variant='h5'>
                <MarkdownRenderer content={data.question} />
            </Typography>
        </CardContent>
    );
}

const CodingQuestion: React.FC<CodingQuestionProps> = ({ question, codeEval, onAnswer }) => {
    const { user } = useAuth(); // Accessing user from AuthContext
    const [value, setValue] = React.useState("log('hello world!');");
    const [cardContent, setCardContent] = React.useState<CardContentType[]>([]);
    const [snackbarOpen, setSnackbarOpen] = React.useState(false);
    const [snackbarMessage, setSnackbarMessage] = React.useState('');
    const isInCodeBlock = React.useRef(false);
    const [isReadingComplete, setIsReadingComplete] = React.useState<boolean>(false);
    const [isLoading, setIsLoading] = React.useState<boolean>(false); // New loading state

    React.useEffect(() => {
        setIsReadingComplete(false); // Reset when question changes
    }, [question]);

    const handleSubmit = async () => {
        setIsLoading(true); // Start loading
        setIsReadingComplete(false);

        try {
            const response = await fetch(`${SUBMIT_API_ENDPOINT}/quiz`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user: user ? user._id : 'test_user',
                    question: question,
                    answer: value,
                }),
            });

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Stream reader is not available');
            }

            setCardContent((prev) => [
                ...prev,
                {
                    id: 1,
                    role: 'human',
                    question: '',
                    code: '',
                },
            ]);

            const readStream = async () => {
                let { done, value } = await reader.read();
                if (done) {
                    setIsReadingComplete(true);
                    setIsLoading(false); // Stop loading
                    return;
                }

                const chunk = new TextDecoder('utf-8').decode(value);
                const jsonStrings = chunk.split('\n').filter(Boolean);

                jsonStrings.forEach((jsonString) => {
                    try {
                        const jsonChunk = JSON.parse(jsonString);
                        const token = jsonChunk.token;

                        setCardContent((prev) =>
                            prev.map((card) => {
                                if (card.id === 1) {
                                    let updatedCard = { ...card };

                                    if (isInCodeBlock.current) updatedCard.code += token;
                                    else { updatedCard.question += token; }

                                    return updatedCard;
                                }
                                return card;
                            })
                        );
                    } catch (error) {
                        console.error('Error parsing JSON chunk', error);
                    }
                });
                await readStream();
            };

            await readStream();
        } catch (error) {
            console.error(error);
            setIsLoading(false); // Stop loading on error
        }
    };

    const gotoNextQuestion = async () => {
        if (onAnswer) {
            await onAnswer(true);
        }
    };

    const handleChange = (value: string) => {
        setValue(value);
    };

    return (
        <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
            <Typography variant="h6">{question}</Typography>

            {cardContent.length > 0 && cardContent[0].code ? (
                <CodeMirrorMerge
                    orientation="a-b"
                    theme={useTheme().palette.mode === 'light' ? githubLight : githubDark}
                >
                    <Original
                        value={value}
                        onChange={handleChange}
                        extensions={[javascript({ jsx: true }), html(), css()]}
                        theme={useTheme().palette.mode === 'light' ? githubLight : githubDark}
                    />
                    <Modified
                        value={cardContent[0].code}
                        extensions={[markdown({ base: markdownLanguage, codeLanguages: languages })]}
                        theme={useTheme().palette.mode === 'light' ? githubLight : githubDark}
                    />
                </CodeMirrorMerge>
            ) : (
                <CodeMirror
                    value={value}
                    onChange={handleChange}
                    extensions={[javascript({ jsx: true }), html(), css()]}
                    theme={useTheme().palette.mode === 'light' ? githubLight : githubDark}
                />
            )}

            {cardContent.map((data) => (
                <InfoCard key={data.id} data={data} value={value} InfoCardProps={codeEval} />
            ))}

            {/* Submit Button with Loading Animation */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={isLoading || isReadingComplete}
                >
                    {isLoading ? 'Submitting...' : 'Submit'}
                </Button>
                {isLoading && <CircularProgress size={24} />}
            </Box>

            {/* Next Question Button */}
            {isReadingComplete && (
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={gotoNextQuestion}
                    sx={{ mt: 2 }}
                >
                    Next Question
                </Button>
            )}

            {/* Snackbar for Notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
            />
        </div>
    );
};

export default CodingQuestion;
