// ShortAnswerQuestion.tsx
import * as React from 'react';
import { useState } from 'react';
import { TextField, Button, Typography } from '@mui/material';

interface ShortAnswerQuestionProps {
    question: string;
    correctAnswer: string;
    onAnswer: (isCorrect: boolean) => void;
}

const ShortAnswerQuestion: React.FC<ShortAnswerQuestionProps> = ({ question, correctAnswer, onAnswer }) => {
    const [answer, setAnswer] = useState<string>('');

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAnswer(event.target.value);
    };

    const handleSubmit = () => {
        if (onAnswer) {
            onAnswer(answer.trim() === correctAnswer);
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
                sx={{ mt: 2 }}
            >
                Submit
            </Button>
        </div>
    );
};

export default ShortAnswerQuestion;
