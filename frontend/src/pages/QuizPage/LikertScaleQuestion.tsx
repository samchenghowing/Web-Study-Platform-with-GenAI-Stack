// LikertScaleQuestion.tsx
import * as React from 'react';
import { useState } from 'react';
import { Radio, RadioGroup, FormControl, FormControlLabel, FormLabel, Button, Typography } from '@mui/material';

interface LikertScaleQuestionProps {
    question: string;
    correctAnswer: string;
    onAnswer: (isCorrect: boolean) => void;
}

const LikertScaleQuestion: React.FC<LikertScaleQuestionProps> = ({ question, correctAnswer, onAnswer }) => {
    const [rating, setRating] = useState<number | string>('');

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRating(event.target.value);
    };

    const handleSubmit = () => {
        if (onAnswer) {
            onAnswer(rating === correctAnswer);
        }
    };

    return (
        <div style={{ padding: 20, maxWidth: 400, margin: '0 auto' }}>
            <FormControl component="fieldset">
                <FormLabel component="legend">
                    <Typography variant="h6">{question}</Typography>
                </FormLabel>
                <RadioGroup value={rating} onChange={handleChange}>
                    {[1, 2, 3, 4, 5].map(num => (
                        <FormControlLabel
                            key={num}
                            value={num}
                            control={<Radio />}
                            label={`${num}`}
                        />
                    ))}
                </RadioGroup>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    sx={{ mt: 2 }}
                >
                    Submit
                </Button>
            </FormControl>
        </div>
    );
};

export default LikertScaleQuestion;
