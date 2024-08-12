import * as React from 'react';
import { SetStateAction, Dispatch } from 'react';
import { extract_task } from './utils';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Markdown from 'react-markdown';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import Button from '@mui/material/Button';

const CHAT_API_ENDPOINT = 'http://localhost:8504/query-stream';
const TASK_API_ENDPOINT = 'http://localhost:8504/generate-task';
const CHAT_HISTORIES_API_ENDPOINT = 'http://localhost:8504/chat_histories';

const BackgroundPaper = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    color: theme.palette.text.secondary,
}));

const StyledCard = styled(Card)(({ theme, role }) => ({
    backgroundColor: role === 'human' ? '#3f50b5' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    color: role === 'human' ? '#fff' : '#000',
    whiteSpace: 'pre-wrap',
}));

function InfoCard({ data, AIChatprops }) {
    return (
        <StyledCard role={data.role} sx={{ minWidth: 275, marginBottom: 2 }}>
            <CardContent>
                <Typography sx={{ fontSize: 14 }} gutterBottom>
                    {data.role}
                </Typography>
                <Typography component={'span'} variant='h5'>
                    <Markdown>{data.question}</Markdown>
                </Typography>
            </CardContent>
            {data.role === 'ai' && (
                <CardActions>
                    <Button size='large' onClick={() => {
                        const [jsCode, htmlCode, cssCode] = extract_task(data.question);
                        data.task = { jsDoc: jsCode, htmlDoc: htmlCode, cssDoc: cssCode };
                        AIChatprops.setQuestion(data.question);
                        AIChatprops.setTask(data.task);
                    }}>
                        Take this task!
                    </Button>
                </CardActions>
            )}
        </StyledCard>
    );
}

interface AIChatProps {
    question: string;
    setQuestion: (mode: string) => void;
    task: { jsDoc: string; htmlDoc: string; cssDoc: string };
    setTask: Dispatch<SetStateAction<{ jsDoc: string; htmlDoc: string; cssDoc: string }>>;
}

interface CardContentType {
    id: number;
    role: string;
    question: string;
    task: {
        jsDoc: string;
        htmlDoc: string;
        cssDoc: string;
    };
}

export default function AIChat(props: AIChatProps) {
    const [userQuestion, setUserQuestion] = React.useState('');
    const [cardContent, setCardContent] = React.useState<CardContentType[]>([]);
    const cardRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const abortController = new AbortController();
        const fetchChatHistory = async () => {
            try {
                const response = await fetch(CHAT_HISTORIES_API_ENDPOINT, {
                    signal: abortController.signal
                });
                const json = await response.json();
                const updatedContent = json.chat_histories.map(element => {
                    const [jsCode, htmlCode, cssCode] = extract_task(element.History.data.content);
                    return {
                        id: element.id,
                        role: element.History.type,
                        question: element.History.data.content,
                        task: {
                            jsDoc: jsCode,
                            htmlDoc: htmlCode,
                            cssDoc: cssCode,
                        },
                    };
                });
                setCardContent(updatedContent);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error(error);
                }
            }
        };

        fetchChatHistory();
        return () => abortController.abort();
    }, []);

    const deleteChatHistory = async (userID: string) => {
        try {
            await fetch(`${CHAT_HISTORIES_API_ENDPOINT}/${userID}`, { method: 'DELETE' });
            setCardContent([]);
        } catch (error) {
            console.error(error);
        }
    };

    const handleChat = async () => {
        if (userQuestion.trim()) {
            const newCardId = Date.now();
            setCardContent(prev => [
                ...prev,
                {
                    id: newCardId,
                    role: 'human',
                    question: userQuestion,
                    task: { jsDoc: '', htmlDoc: '', cssDoc: '' },
                },
                {
                    id: newCardId + 1,
                    role: 'ai',
                    question: '',
                    task: { jsDoc: '', htmlDoc: '', cssDoc: '' },
                }
            ]);
            setUserQuestion('');

            try {
                const response = await fetch(TASK_API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: userQuestion, rag: false })
                });

                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error('Stream reader is not available');
                }

                const readStream = async () => {
                    let { done, value } = await reader.read();
                    if (done) return;

                    const chunk = new TextDecoder('utf-8').decode(value);
                    const jsonStrings = chunk.split('\n').filter(Boolean);

                    jsonStrings.forEach(jsonString => {
                        try {
                            const jsonChunk = JSON.parse(jsonString);
                            setCardContent(prev => prev.map(card => {
                                if (card.id === newCardId + 1) {
                                    return {
                                        ...card,
                                        question: card.question + jsonChunk.token,
                                    };
                                }
                                return card;
                            }));
                        } catch (error) {
                            console.error('Error parsing JSON chunk', error);
                        }
                    });
                    await readStream();
                };

                await readStream();
            } catch (error) {
                console.error('Error during stream', error);
            }
        }
    };

    React.useEffect(() => {
        if (cardRef.current) {
            cardRef.current.scrollTo(0, cardRef.current.scrollHeight);
        }
    }, [cardContent]);

    return (
        <BackgroundPaper ref={cardRef} sx={{ maxHeight: 500, minHeight: 500, overflow: 'auto' }}>
            {cardContent.map(data => (
                <InfoCard key={data.id} data={data} AIChatprops={props} />
            ))}
            <TextField
                fullWidth
                multiline
                id='user-prompt'
                placeholder='How to print hello world in javascript?'
                value={userQuestion}
                onChange={e => setUserQuestion(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter') handleChat();
                }}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position='end'>
                            <IconButton edge='end' color='primary' onClick={handleChat}>
                                <SendIcon />
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />
            <Button size='large' onClick={() => deleteChatHistory('test_user')}>
                Delete Chat History
            </Button>
        </BackgroundPaper>
    );
}
