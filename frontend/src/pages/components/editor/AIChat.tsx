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

const CHAT_API_ENDPOINT = 'http://localhost:8504/query-stream';
const TASK_API_ENDPOINT = 'http://localhost:8504/generate-task';
const CHAT_HISTORIES_API_ENDPOINT = 'http://localhost:8504/chat_histories';

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
                <Typography color={data.role === 'human' ? '#fff' : '#000'} component={'span'} variant='h5'>
                    <Markdown>{data.content}</Markdown>
                </Typography>

                {data.role === 'ai' && <>
                    <Typography sx={{ mb: 1.5 }}>{data.question}</Typography>
                    <Typography>
                        <Markdown>
                            {data.task.jsDoc}
                        </Markdown>
                    </Typography>
                </> // show task created by ai
                }


            </CardContent>
            {data.role === 'ai' &&
                <CardActions>
                    <Button size='large' onClick={() => {
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
    const [userQuestion, setUserQuestion] = React.useState('');
    const [cardContent, setCardContent] = React.useState<Array<cardContentType>>([]);
    const cardRef = React.useRef<HTMLDivElement>(null);

    const getChatHistory = () => {
        fetch(CHAT_HISTORIES_API_ENDPOINT)
            .then(response => response.json())
            .then(json => {
                console.log(json.chat_histories);

                // sample response
                // {"chat_histories":[{"id":"66ab9bd1f5f91e16b33f5599","SessionId":"test_user","History":{"type":"human","data":{"content":"find max in array","additional_kwargs":{},"response_metadata":{},"type":"human","name":null,"id":null,"example":false}}},{"id":"66ab9bd1f5f91e16b33f559a","SessionId":"test_user","History":{"type":"ai","data":{"content":"Here's an example of a faulty JavaScript function that attempts to find the maximum value in an array:\n\n**Question**\nTitle: Finding Max Value in Array\nQuestion:\n```javascript\nfunction findMax(arr) {\n  let max = arr[0];\n  for (let i = 1; i < arr.length; i++) {\n    if (arr[i] > max) {\n      max = arr[i];\n    }\n  }\n  return max;\n}\n\n// Test the function with an array: [4, 2, 9, 6, 5]\nconsole.log(findMax([4, 2, 9, 6, 5])); // Output: ?\n```\n**Solution**\n```javascript\nfunction findMax(arr) {\n  if (arr.length === 0) {\n    throw new Error(\"Array is empty\");\n  }\n  let max = arr[0];\n  for (let i = 1; i < arr.length; i++) {\n    if (arr[i] > max) {\n      max = arr[i];\n    }\n  }\n  return max;\n}\n\n// Test the function with an array: [4, 2, 9, 6, 5]\nconsole.log(findMax([4, 2, 9, 6, 5])); // Output: 9\n```\nIn this corrected solution, we added a check at the beginning of the `findMax` function to ensure that the input array is not empty. If it is empty, an error is thrown with a message indicating that the array is empty. This prevents the function from attempting to access elements in an empty array, which would result in an \"undefined\" value being returned.","additional_kwargs":{},"response_metadata":{"model":"llama3.1","created_at":"2024-08-01T14:29:37.298108981Z","message":{"role":"assistant","content":""},"done_reason":"stop","done":true,"total_duration":89996188739,"load_duration":4519740962,"prompt_eval_count":292,"prompt_eval_duration":4052657000,"eval_count":348,"eval_duration":81333721000},"type":"ai","name":null,"id":"run-c6248bc1-061d-4290-ac23-a48a912e5c8e-0","example":false,"tool_calls":[],"invalid_tool_calls":[],"usage_metadata":null}}}]}
                json.chat_histories.forEach(element => {

                    // Extract JavaScript code using regular expressions
                    const jsCodeRegex = /```javascript\n([\s\S]*?)\n```/g;
                    const jsCodeMatches = [...element.History.data.content.matchAll(jsCodeRegex)];
                    const jsCode = jsCodeMatches.map(match => match[1]).join('\n');

                    // Extract title and question
                    const titleRegex = /Title: (.*)\n/;
                    const questionRegex = /Question:\n([\s\S]*?)\n```/;
                    const titleMatch = element.History.data.content.match(titleRegex);
                    const questionMatch = element.History.data.content.match(questionRegex);

                    const title = titleMatch ? titleMatch[1] : '';
                    const question = questionMatch ? questionMatch[1] : '';

                    // Remove the solution section from content
                    const solutionRegex = /\*\*Solution\*\*[\s\S]*$/;
                    const contentWithoutSolution = element.History.data.content.replace(solutionRegex, '');

                    setCardContent(prevCardContent => [
                        ...prevCardContent,
                        {
                            id: element.id,
                            role: element.History.type,
                            content: contentWithoutSolution,
                            question: question,
                            task: {
                                jsDoc: jsCode,
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
                    role: 'human',
                    content: userQuestion,
                    question: '',
                    task: {
                        jsDoc: '',
                        htmlDoc: '',
                        cssDoc: '',
                    },
                },
                {
                    id: newCardId + 1,
                    role: 'ai',
                    content: '',
                    // TODO: get below from formatted response from AI
                    question: '',
                    task: {
                        jsDoc: '',
                        htmlDoc: '',
                        cssDoc: '',
                    },
                }
            ]);
            setUserQuestion('');

            try {
                const response = await fetch(TASK_API_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        'text': userQuestion,
                        'rag': false
                    })
                });

                const reader = response.body!.getReader();
                if (reader == null) console.log('error connection to gen ai');

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
                                        question: 'Fix the problem below such that it will output \'hello world\' in console.',
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
                id='user-prompt'
                placeholder='How to print hello world in javascript?'
                value={userQuestion}
                onChange={e => {
                    setUserQuestion(e.target.value)
                }}
                onKeyDown={e => {
                    if (e.key === 'Enter') handleChat();
                }}
                InputProps={{
                    endAdornment:
                        <InputAdornment position='end'>
                            <IconButton edge='end' color='primary' onClick={handleChat}>
                                <SendIcon />
                            </IconButton>
                        </InputAdornment>
                }}
            />
            <Button size='large' onClick={() => { deleteChatHistory('test_user') }}>
                Delete Chat History
            </Button>
        </BackgroundPaper>
    );
}
