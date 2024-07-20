import * as React from 'react';
import { SetStateAction, Dispatch } from 'react';
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

const CHAT_API_ENDPOINT = "http://localhost:8504/query-stream";
const TASK_API_ENDPOINT = "http://localhost:8504/generate-task";

const BackgroundPaper = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    color: theme.palette.text.secondary,
}));

function InfoCard({ data, AIChatprops }) {
    const StyledCard = styled(Card)(({ theme }) => ({
        backgroundColor: data.role === 'human' ? '#3f50b5' : '#fff',
        ...theme.typography.body2,
        padding: theme.spacing(1),
        color: theme.palette.text.secondary,
        whiteSpace: 'pre-wrap', // Add this line
    }));

    return (
        <StyledCard sx={{ minWidth: 275, marginBottom: 2 }}>
            <CardContent>
                <Typography sx={{ fontSize: 14 }} color={data.role === 'human' ? '#fff' : '#000'} gutterBottom>
                    {data.role}
                </Typography>
                <Typography color={data.role === 'human' ? '#fff' : '#000'} component={'span'} variant="h5">
                    <Markdown>{data.content}</Markdown>
                </Typography>
                <Typography sx={{ mb: 1.5 }} color={data.role === 'human' ? '#fff' : '#000'}>
                    {data.question}
                </Typography>
                <Typography variant="body2">
                    {data.task.jsDoc}
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
    task: { jsDoc: string; htmlDoc: string; cssDoc: string };
    setTask: Dispatch<SetStateAction<{ jsDoc: string; htmlDoc: string; cssDoc: string }>>;
}

export default function AIChat(props: AIChatProps) {
    const [userQuestion, setUserQuestion] = React.useState("");
    const [cardContent, setCardContent] = React.useState([
        {
            id: 1,
            role: "ai",
            content: "Hi! I prepared the following task for you! Lets' see if you can fix it!",
            question: "Fix the problem below such that it will output \"hello world\" in console.",
            task: {
                jsDoc: 'console.log\'hello world!',
                htmlDoc: 'Hello world',
                cssDoc: '',
            }
        },
    ]);
    const cardRef = React.useRef<HTMLDivElement>(null);

    const handleChat = async () => {
        if (userQuestion.trim()) { // Check if the prompt is not empty
            const newCardId = Date.now();
            setCardContent(prevCardContent => [
                ...prevCardContent,
                {
                    id: newCardId,
                    role: "human",
                    content: userQuestion,
                    question: "",
                    task: {
                        jsDoc: '',
                        htmlDoc: '',
                        cssDoc: '',
                    },
                },
                {
                    id: newCardId + 1,
                    role: "ai",
                    content: "",
                    // TODO: get below from formatted response from AI
                    question: "",
                    task: {
                        jsDoc: '',
                        htmlDoc: '',
                        cssDoc: '',
                    },
                }
            ]);

            var messages = cardContent.map(({ role, content }) => {
                let doc = { role, content };
                return doc;
            });
            messages.push({ role: "human", content: userQuestion });
            setUserQuestion("");

            try {
                const response = await fetch(CHAT_API_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        "messages": messages,
                        "rag": false
                    })
                });

                console.log(JSON.stringify({
                    "messages": messages,
                    "rag": false
                }));
                const reader = response.body!.getReader();
                if (reader == null) console.log("error connection to gen ai");

                const readStream = async () => {
                    let { done, value } = await reader.read();
                    if (done) {
                        console.log('Stream complete');
                        return;
                    }

                    // Decode the stream chunk to a string
                    const chunk = new TextDecoder('utf-8').decode(value);
                    // Split the chunk by newlines, as each JSON object ends with a newline
                    const jsonStrings = chunk.split('\n').filter(Boolean);

                    jsonStrings.forEach(jsonString => {
                        try {
                            const jsonChunk = JSON.parse(jsonString);
                            console.log(jsonChunk);
                            // Update the content of the new card with the received chunk
                            setCardContent(prevCardContent => prevCardContent.map(card => {
                                if (card.id === newCardId + 1) {
                                    return {
                                        ...card,
                                        content: card.content + jsonChunk.token,
                                        // TODO: get below from formatted response from AI
                                        question: "Fix the problem below such that it will output \"hello world\" in console.",
                                        task: {
                                            jsDoc: 'console.log\'hello world!',
                                            htmlDoc: 'Hello world',
                                            cssDoc: '',
                                        }
                                    };
                                }
                                return card;
                            }));
                        } catch (error) {
                            console.error('Error parsing JSON chunk', error);
                        }
                    });
                    // Read the next chunk
                    readStream();
                };
                // Start reading the stream
                readStream();

            } catch (error) {
                console.error('Stream end with error', error);
            }
        }
    };

    const handleTask = async () => {
        try {
            const response = await fetch(TASK_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': 'http://localhost:8504',
                },
                body: JSON.stringify({
                    "text": userQuestion
                })
            });

            const reader = response.body!.getReader();
            if (reader == null) console.log("error connection to gen ai");

            const readStream = async () => {
                let { done, value } = await reader.read();
                if (done) {
                    console.log('Stream complete');
                    return;
                }

                // Decode the stream chunk to a string
                const chunk = new TextDecoder('utf-8').decode(value);
                // Split the chunk by newlines, as each JSON object ends with a newline
                const jsonStrings = chunk.split('\n').filter(Boolean);

                jsonStrings.forEach(jsonString => {
                    try {
                        const jsonChunk = JSON.parse(jsonString);
                        console.log(jsonChunk);
                    } catch (error) {
                        console.error('Error parsing JSON chunk', error);
                    }
                });
                // Read the next chunk
                readStream();
            };
            // Start reading the stream
            readStream();

            const task = await response.json();
            console.log(task)
        } catch (error) {
            console.error('Stream end with error', error);
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
                    if (e.key === "Enter") {
                        // handleChat();
                        handleTask();
                    }

                }}
                InputProps={{
                    endAdornment:
                        <InputAdornment position="end">
                            <IconButton edge="end" color="primary" onClick={handleChat}>
                                <SendIcon />
                            </IconButton>
                        </InputAdornment>
                }}
            />
        </BackgroundPaper>
    );
}
