import * as React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import CodeMirrorMerge from 'react-codemirror-merge';
import { EditorView } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { useTheme } from '@mui/material/styles';
import CardContent from '@mui/material/CardContent';
import Markdown from 'react-markdown';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import { Button, Typography, Snackbar } from '@mui/material';
import { useAuth } from '../../authentication/AuthContext';

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
                <Markdown>{data.question}</Markdown>
            </Typography>

            {/* {data.code && (
                    <CodeMirrorMerge
                        orientation="a-b"
                        theme={useTheme().palette.mode === 'light' ? githubLight : githubDark}
                    >
                        <Original value={value} />
                        <Modified
                            value={data.code}
                            extensions={[EditorView.editable.of(false), EditorState.readOnly.of(true)]}
                        />
                    </CodeMirrorMerge>
                )} */}
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
    const codeBlockMarkerCount = React.useRef(0);

    function processChunk(chunk) {
        for (let i = 0; i < chunk.length; i++) {
            if (chunk[i] === '`') {
                codeBlockMarkerCount.current += 1;
            } else {
                codeBlockMarkerCount.current = 0;
            }

            // Check if we have three consecutive backticks
            if (codeBlockMarkerCount.current === 3) {
                isInCodeBlock.current = !isInCodeBlock.current; // Toggle state
                codeBlockMarkerCount.current = 0; // Reset stack after processing
            }
        }
    }

    const handleSubmit = async () => {
        try {
            const response = await fetch(`${SUBMIT_API_ENDPOINT}/quiz`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user: user ? user.id : 'test_user',
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
                if (done) return;

                const chunk = new TextDecoder('utf-8').decode(value);
                const jsonStrings = chunk.split('\n').filter(Boolean);

                jsonStrings.forEach((jsonString) => {
                    try {
                        const jsonChunk = JSON.parse(jsonString);
                        const token = jsonChunk.token;

                        processChunk(token);

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
                        extensions={[EditorView.editable.of(false), EditorState.readOnly.of(true)]}
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

            <Button variant="contained" color="primary" onClick={handleSubmit} sx={{ mt: 2 }}>
                Submit
            </Button>

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