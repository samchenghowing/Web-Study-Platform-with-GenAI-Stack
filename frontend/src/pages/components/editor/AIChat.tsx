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

const TASK_API_ENDPOINT = "http://localhost:8504/generate-task";
const CHAT_HISTORIES_API_ENDPOINT = "http://localhost:8504/chat_histories";

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

                {data.role === 'ai' && <>
                    <Typography sx={{ mb: 1.5 }}>{data.question}</Typography>
                    <Typography variant="body2">{data.task.jsDoc}</Typography>
                </> // show task created by ai
                }


            </CardContent>
            {data.role === 'ai' &&
                <CardActions>
                    <Button size="large" onClick={() => {
                        // TODO: get below from formatted response from ollama
                        AIChatprops.setQuestion(data.question);
                        AIChatprops.setTask(data.task);
                    }}>
                        Take this task!
                    </Button>
                </CardActions>
            }
        </StyledCard>
    );
}

interface AIChatProps {
    question: string;
    setQuestion: (mode: string) => void;
    task: { jsDoc: string; htmlDoc: string; cssDoc: string };
    setTask: Dispatch<SetStateAction<{ jsDoc: string; htmlDoc: string; cssDoc: string }>>;
}

interface cardContentType {
    id: number;
    role: string;
    content: string;
    question: string;
    task: {
        jsDoc: string;
        htmlDoc: string;
        cssDoc: string;
    };
}


export default function AIChat(props: AIChatProps) {
    const [userQuestion, setUserQuestion] = React.useState("");
    const [cardContent, setCardContent] = React.useState<Array<cardContentType>>([]);
    const cardRef = React.useRef<HTMLDivElement>(null);

    const getChatHistory = () => {
        fetch(CHAT_HISTORIES_API_ENDPOINT)
            .then(response => response.json())
            .then(json => {
                console.log(json.chat_histories);
                json.chat_histories.forEach(element => {
                    setCardContent(prevCardContent => [
                        ...prevCardContent,
                        {
                            id: element.id,
                            role: element.History.type,
                            content: element.History.data.content,
                            question: "",
                            task: {
                                jsDoc: '',
                                htmlDoc: '',
                                cssDoc: '',
                            },
                        }
                    ]);
                });
            })
            .catch(error => {
                console.error(error);
            });
    };

    const deleteChatHistory = (userID) => {
        fetch(`${CHAT_HISTORIES_API_ENDPOINT}/${userID}`, { method: 'DELETE' })
            .then(response => {
            })
            .catch(error => {
                console.error(error);
            });
        setCardContent([]);
    };

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
            setUserQuestion("");

            try {
                const response = await fetch(TASK_API_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        "text": userQuestion,
                        "rag": false
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

    React.useEffect(() => {
        if (cardRef.current != null) cardRef.current.scrollTo(0, cardRef.current.scrollHeight);
    }, [cardContent]);

    React.useEffect(() => {
        // initialize
        return () => {
            getChatHistory();
        }
    }, []);


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
                    if (e.key === "Enter") handleChat();
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
            <Button size="large" onClick={() => { deleteChatHistory("test_user") }}>
                Delete Chat History
            </Button>
        </BackgroundPaper>
    );
}
