import * as React from 'react';
import { useState } from 'react';
import { Radio, RadioGroup, FormControl, FormControlLabel, FormLabel, Button, Typography, CircularProgress } from '@mui/material';
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
    const [isReadingComplete, setIsReadingComplete] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false); // New loading state

    React.useEffect(() => {
        setSelectedChoice('');
        setCurrentCard({ id: 1, role: 'human', question: '', code: '' });
        setIsReadingComplete(false);
        setIsLoading(false); // Reset loading state
    }, [question]);

    const handleChoiceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedChoice(event.target.value);
    };

    const handleSubmit = async () => {
        setIsLoading(true); // Start loading animation
        setIsReadingComplete(false); // Reset reading state

        try {
            const endpoint = isLanding ? `${SUBMIT_API_ENDPOINT}/settings` : `${SUBMIT_API_ENDPOINT}/quiz`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user: user ? user._id : 'test_user',
                    question: question,
                    answer: selectedChoice,
                }),
            });

            if (!response.ok) {
                const json = await response.json();
                console.error(json.detail);
                throw new Error('Failed to submit');
            }

            if (isLanding) {
                setIsReadingComplete(true);
            } else {
                const reader = response.body?.getReader();
                if (!reader) throw new Error('Stream reader is not available');

                const readStream = async () => {
                    let { done, value } = await reader.read();
                    if (done) {
                        setIsReadingComplete(true);
                        setIsLoading(false); // Stop loading animation
                        return;
                    }

                    const chunk = new TextDecoder('utf-8').decode(value);
                    setCurrentCard((prevCard) => ({
                        ...prevCard,
                        question: prevCard.question + chunk,
                    }));
                    await readStream();
                };

                await readStream();
            }
        } catch (error) {
            console.error('Error during submission:', error);
        } finally {
            setIsLoading(false); // Ensure loading stops in any case
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
                <RadioGroup value={selectedChoice} onChange={handleChoiceChange} >
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
                    disabled={!selectedChoice || isLoading || isReadingComplete}
                    sx={{ mt: 2 }}
                >
                    {isLoading ? <CircularProgress size={24} /> : 'Submit'}
                </Button>

                {isReadingComplete && (
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
