import * as React from 'react';
import { SetStateAction, Dispatch } from 'react';
import { extract_task, extractQuestion } from './utils';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { useAuth } from '../../authentication/AuthContext';

const TASK_API_ENDPOINT = 'http://localhost:8504/generate-task';
const CHAT_HISTORIES_API_ENDPOINT = 'http://localhost:8504/chat_histories';

const BackgroundPaper = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    color: theme.palette.text.secondary,
    width: '100%', // Set width to 70%
    height: '50vh', // Set height to 70% of the viewport height
    margin: 'auto', // Center it horizontally
}));

const StyledCard = styled(Card)(({ theme, role }) => ({
    backgroundColor: role === 'human' ? theme.palette.primary.main : theme.palette.background.paper,
    color: role === 'human' ? theme.palette.common.white : theme.palette.text.primary,
    ...theme.typography.body2,
    padding: theme.spacing(1),
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
                    <MarkdownRenderer content={data.question} />
                </Typography>
            </CardContent>
            {data.role === 'ai' && (
                <CardActions>
                    <Button size='large' onClick={() => {
                        const [jsCode, htmlCode, cssCode] = extract_task(data.question);
                        data.task = { jsDoc: jsCode, htmlDoc: htmlCode, cssDoc: cssCode };
                        AIChatprops.setQuestion(extractQuestion(data.question));
                        AIChatprops.setTask(data.task);
                    }}>
                        Take this task!
                    </Button>
                </CardActions>
            )}
        </StyledCard>
    );
}

function ChatInput({ userQuestion, setUserQuestion, handleChat }) {
    return (
        <Box sx={{ mt: 2 }}>
            <TextField
                fullWidth
                multiline
                id='user-prompt'
                placeholder='How to print hello world in javascript?'
                value={userQuestion}
                onChange={e => setUserQuestion(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleChat();
                    }
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
        </Box>
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
    const { user } = useAuth(); // Accessing user from AuthContext

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

    const deleteChatHistory = async () => {
        try {
            await fetch(`${CHAT_HISTORIES_API_ENDPOINT}/${user?.id}`, { method: 'DELETE' });
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
                    body: JSON.stringify({ user: user?.id, text: userQuestion, rag: false })
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
        <Box>
            <BackgroundPaper ref={cardRef} sx={{ overflow: 'auto' }}>
                {cardContent.map(data => (
                    <InfoCard key={data.id} data={data} AIChatprops={props} />
                ))}
            </BackgroundPaper>
            <ChatInput
                userQuestion={userQuestion}
                setUserQuestion={setUserQuestion}
                handleChat={handleChat}
            />
            <Button size='large' onClick={() => deleteChatHistory()} sx={{ mt: 2 }}>
                Delete Chat History
            </Button>
        </Box>
    );
}
