import * as React from 'react';
import { useState } from 'react';
import { Radio, RadioGroup, FormControl, FormControlLabel, FormLabel, Button, Typography } from '@mui/material';
import { useAuth } from '../../authentication/AuthContext';
import CardContent from '@mui/material/CardContent';
import MarkdownRenderer from '../../components/MarkdownRenderer';

const SUBMIT_API_ENDPOINT = 'http://localhost:8504/submit';

interface MultipleChoiceQuestionProps {
    question: string;
    choices: string[];
    correctAnswer: string;
    isLanding: boolean;
    onAnswer: (isCorrect: boolean) => void;
}

interface CardContentType {
    id: number;
    role: string;
    question: string;
    code: string;
}

const InfoCard: React.FC<{ data: CardContentType }> = React.memo(({ data }) => {
    return (
        <CardContent>
            <Typography component={'span'} variant='h5'>
                <MarkdownRenderer content={data.question} />
            </Typography>
        </CardContent>
    );
});

const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({ question, choices, correctAnswer, isLanding, onAnswer }) => {
    const { user } = useAuth();
    const [selectedChoice, setSelectedChoice] = useState<string>('');
    const [currentCard, setCurrentCard] = useState<CardContentType>({ id: 1, role: 'human', question: '', code: '' });
    const [isReadingComplete, setIsReadingComplete] = useState<boolean>(false); // New state

    React.useEffect(() => {
        setSelectedChoice('');
        setCurrentCard({ id: 1, role: 'human', question: '', code: '' });
        setIsReadingComplete(false); // Reset when question changes
    }, [question]);

    const handleChoiceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedChoice(event.target.value);
    };

    const handleSubmit = async () => {
        if (isLanding) {
            const response = await fetch(`${SUBMIT_API_ENDPOINT}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user: user ? user.id : 'test_user',
                    question: question,
                    answer: selectedChoice,
                }),
            });

            const json = await response.json();
            console.log(json);

            if (!response.ok) alert(json.detail);
            setIsReadingComplete(true);
        }
        else {
            const response = await fetch(`${SUBMIT_API_ENDPOINT}/quiz`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user: user ? user.id : 'test_user',
                    question: question,
                    answer: selectedChoice,
                }),
            });
            const reader = response.body?.getReader();
            if (!reader) throw new Error('Stream reader is not available');

            const readStream = async () => {
                let { done, value } = await reader.read();
                if (done) {
                    setIsReadingComplete(true); // Mark reading as complete
                    return;
                }

                const chunk = new TextDecoder('utf-8').decode(value);
                const jsonStrings = chunk.split('\n').filter(Boolean);

                jsonStrings.forEach((jsonString) => {
                    try {
                        const jsonChunk = JSON.parse(jsonString);
                        const token = jsonChunk.token;

                        setCurrentCard((prevCard) => ({
                            ...prevCard,
                            question: prevCard.question + token,
                        }));

                    } catch (error) {
                        console.error('Error parsing JSON chunk', error);
                    }
                });
                await readStream();
            };
            await readStream();
        }
    };

    const gotoNextQuestion = async () => {
        if (onAnswer) {
            const isCorrect = selectedChoice === correctAnswer;
            await onAnswer(isCorrect);
        }
    };

    return (
        <div style={{ padding: 20, maxWidth: 400, margin: '0 auto' }}>
            <FormControl component="fieldset">
                <FormLabel component="legend">
                    <Typography variant="h6">{question}</Typography>
                </FormLabel>
                <RadioGroup value={selectedChoice} onChange={handleChoiceChange}>
                    {choices && choices.length > 0 ? (
                        choices.map((choice, index) => (
                            <FormControlLabel
                                key={index}
                                value={choice}
                                control={<Radio />}
                                label={choice}
                            />
                        ))
                    ) : (
                        <Typography>No choices available</Typography>
                    )}
                </RadioGroup>

                <InfoCard data={currentCard} />

                <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={!selectedChoice} // Disable button if no choice is selected
                    sx={{ mt: 2 }}
                >
                    Submit
                </Button>

                {isReadingComplete && ( // Only show if reading is complete
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={gotoNextQuestion}
                        sx={{ mt: 2 }}
                    >
                        Next question
                    </Button>
                )}
            </FormControl>
        </div>
    );
};

export default MultipleChoiceQuestion;