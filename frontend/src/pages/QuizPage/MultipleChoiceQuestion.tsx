import * as React from 'react';
import { useState } from 'react';
import { Radio, RadioGroup, FormControl, FormControlLabel, FormLabel, Button, Typography } from '@mui/material';
import { useAuth } from '../../authentication/AuthContext';
import CardContent from '@mui/material/CardContent';
import MarkdownRenderer from '../../components/MarkdownRenderer'

const SUBMIT_API_ENDPOINT = 'http://localhost:8504/submit';

interface MultipleChoiceQuestionProps {
    question: string;
    choices: string[];
    correctAnswer: string;
    onAnswer: (isCorrect: boolean) => void;
}

interface CardContentType {
    id: number;
    role: string;
    question: string;
    code: string;
}

export function InfoCard({ data }) {
    return (
        <CardContent>
            <Typography component={'span'} variant='h5'>
                <MarkdownRenderer content={data.question} />
            </Typography>
        </CardContent>
    );
}

const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({ question, choices, correctAnswer, onAnswer }) => {
    const { user } = useAuth(); // Accessing user from AuthContext
    const [selectedChoice, setSelectedChoice] = useState<string>('');
    const [cardContent, setCardContent] = React.useState<CardContentType[]>([]);

    React.useEffect(() => {
        setSelectedChoice(''); // Reset selected choice when question changes
    }, [question]);

    const handleChoiceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedChoice(event.target.value);
    };

    const handleSubmit = async () => {
        if (onAnswer) {
            const response = await fetch(`${SUBMIT_API_ENDPOINT}/quiz`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user: user ? user.id : 'test_user',
                    question: question, // Assuming you have this in your state
                    answer: selectedChoice,
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

                        setCardContent((prev) =>
                            prev.map((card) => {
                                if (card.id === 1) {
                                    let updatedCard = { ...card };
                                    updatedCard.question += token;

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
            // go to next question
            const isCorrect = true;
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
                    {choices.map((choice, index) => (
                        <FormControlLabel
                            key={index}
                            value={choice}
                            control={<Radio />}
                            label={choice}
                        />
                    ))}
                </RadioGroup>


                {cardContent.map((data) => (
                    <InfoCard key={data.id} data={data} />
                ))}

                <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={!selectedChoice} // Disable button if no choice is selected
                    sx={{ mt: 2 }} // MUI v5 syntax for margin-top
                >
                    Submit
                </Button>
            </FormControl>
        </div>
    );
};

export default MultipleChoiceQuestion;