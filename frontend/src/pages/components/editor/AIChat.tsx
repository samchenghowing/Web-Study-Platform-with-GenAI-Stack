import * as React from 'react';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Markdown from 'react-markdown' // For fromatting GenAI response
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import Button from '@mui/material/Button';

const API_ENDPOINT = "http://localhost:8504/query-stream";

const BackgroundPaper = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    color: theme.palette.text.secondary,
}));

function InfoCard({ data, AIChatprops }) {
    const StyledCard = styled(Card)(({ theme }) => ({
        backgroundColor: data.role === 'user' ? '#3f50b5' : '#fff',
        ...theme.typography.body2,
        padding: theme.spacing(1),
        color: theme.palette.text.secondary,
        whiteSpace: 'pre-wrap', // Add this line
    }));

    return (
        <StyledCard sx={{ minWidth: 275, marginBottom: 2 }}>
            <CardContent>
                <Typography sx={{ fontSize: 14 }} color={data.role === 'user' ? '#fff' : '#000'} gutterBottom>
                    {data.role}
                </Typography>
                <Typography color={data.role === 'user' ? '#fff' : '#000'} component={'span'} variant="h5">
                    <Markdown>{data.content}</Markdown>
                </Typography>
                <Typography sx={{ mb: 1.5 }} color={data.role === 'user' ? '#fff' : '#000'}>
                    {data.question}
                </Typography>
                <Typography variant="body2">
                    {data.task}
                </Typography>

            </CardContent>
            <CardActions>
                <Button size="large" onClick={() => {
                    // TODO: get below from formatted response from ollama
                    AIChatprops.setQuestion(data.question);
                    AIChatprops.setTask(data.task);
                }}>
                    Take this task!
                </Button>
            </CardActions>
        </StyledCard>
    );
}

// Better add in backend?
// TODO: formatted response json from AI  
// {
//     question: "Fix the problem below such that it will output \"hello world\" in console.",
//     task: "console.log'hello world!';",
// },
// https://github.com/ollama/ollama/blob/main/docs/api.md#request-json-mode

interface AIChatProps {
    question: string;
    setQuestion: (mode: string) => void;
    task: string;
    setTask: (mode: string) => void;
}

export default function AIChat(props: AIChatProps) {
    const [userQuestion, setUserQuestion] = React.useState("");
    const [cardContent, setCardContent] = React.useState([
        {
            id: 1,
            role: "assistant",
            content: "Hi! I prepared the following task for you! Lets' see if you can fix it!",
            question: "Fix the problem below such that it will output \"hello world\" in console.",
            task: "console.log'hello world!",
        },
    ]);
    const cardRef = React.useRef<HTMLDivElement>(null);

    const handleClick = async () => {
        if (userQuestion.trim()) { // Check if the prompt is not empty
            const newCardId = Date.now();
            setCardContent(prevCardContent => [
                ...prevCardContent,
                {
                    id: newCardId,
                    role: "user",
                    content: userQuestion,
                    question: "",
                    task: "",
                },
                {
                    id: newCardId + 1,
                    role: "assistant",
                    content: "",
                    // TODO: get below from formatted response from AI
                    question: "",
                    task: "",
                }
            ]);

            try {
                const evt = new EventSource(`${API_ENDPOINT}?text=${encodeURI(userQuestion)}&rag=${false}`);
                setUserQuestion("");
                evt.onmessage = (e) => {
                    if (e.data) {
                        const data = JSON.parse(e.data);
                        if (data.init) {
                            console.log('Stream begin');
                            return;
                        }
                        setCardContent(prevCardContent => prevCardContent.map(card => {
                            if (card.id === newCardId + 1) {
                                return {
                                    ...card,
                                    content: card.content + data.token,
                                    // TODO: get below from formatted response from AI
                                    question: "Fix the problem below such that it will output \"hello world\" in console.",
                                    task: "console.log'hello world!",
                                };
                            }
                            return card;
                        }));
                    }
                };
                evt.onerror = (e) => {
                    // Stream will end with an error
                    // and we want to close the connection on end (otherwise it will keep reconnecting)
                    evt.close();
                };
            } catch (error) {
                console.error('Stream end with error', error);
            }
        }
    };

    React.useEffect(() => {
        if (cardRef.current != null) cardRef.current.scrollTo(0, cardRef.current.scrollHeight);
    }, [cardContent]);


    return (
        <BackgroundPaper
            ref={cardRef}
            sx={{ maxHeight: 500, minHeight: 500, overflow: 'auto' }}>
            {cardContent.map((data) => (
                <InfoCard key={data.id} data={data} AIChatprops={props} />
            ))}
            <TextField
                fullWidth
                multiline
                id="user-prompt"
                placeholder="How to print hello world in javascript?"
                value={userQuestion}
                onChange={e => {
                    setUserQuestion(e.target.value)
                }}
                onKeyDown={e => {
                    if (e.key === "Enter") handleClick();
                }}
                InputProps={{
                    endAdornment:
                        <InputAdornment position="end">
                            <IconButton edge="end" color="primary" onClick={handleClick}>
                                <SendIcon />
                            </IconButton>
                        </InputAdornment>
                }}
            />
        </BackgroundPaper>
    );
}
