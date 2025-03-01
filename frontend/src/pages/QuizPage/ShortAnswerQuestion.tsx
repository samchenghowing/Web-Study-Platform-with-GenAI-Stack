import * as React from 'react';
import { useState } from 'react';
import { TextField, Button, Typography, CircularProgress } from '@mui/material';
import { useAuth } from '../../authentication/AuthContext';

const SUBMIT_API_ENDPOINT = 'http://localhost:8504/submit';

interface ShortAnswerQuestionProps {
    question: string;
    correctAnswer: string;
    isLanding: boolean;
    onAnswer: (isCorrect: boolean) => void;
}

const ShortAnswerQuestion: React.FC<ShortAnswerQuestionProps> = ({ question, correctAnswer, isLanding, onAnswer }) => {
    const { user } = useAuth();
    const [answer, setAnswer] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isReadingComplete, setIsReadingComplete] = useState<boolean>(false);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAnswer(event.target.value);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setIsReadingComplete(false);

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
                    answer: answer.trim(),
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
                        setIsLoading(false);
                        return;
                    }

                    const chunk = new TextDecoder('utf-8').decode(value);
                    const jsonStrings = chunk.split('\n').filter(Boolean);

                    jsonStrings.forEach((jsonString) => {
                        try {
                            const jsonChunk = JSON.parse(jsonString);
                            // Handle the jsonChunk as needed
                        } catch (error) {
                            console.error('Error parsing JSON chunk', error);
                        }
                    });

                    await readStream();
                };

                await readStream();
            }
        } catch (error) {
            console.error('Error during submission:', error);
        } finally {
            setIsLoading(false);
            if (onAnswer) {
                const isCorrect = answer.trim() === correctAnswer;
                await onAnswer(isCorrect);
            }
        }
    };

    return (
        <div style={{ padding: 20, maxWidth: 400, margin: '0 auto' }}>
            <Typography variant="h6">{question}</Typography>
            <TextField
                variant="outlined"
                value={answer}
                onChange={handleChange}
                fullWidth
                margin="normal"
            />
            <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={isLoading || isReadingComplete}
                sx={{ mt: 2 }}
            >
                {isLoading ? <CircularProgress size={24} /> : 'Submit'}
            </Button>
        </div>
    );
};

export default ShortAnswerQuestion;
