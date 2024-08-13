import * as React from 'react';
import { useState } from 'react';
import { Radio, RadioGroup, FormControl, FormControlLabel, FormLabel, Button, Typography } from '@mui/material';

interface MultipleChoiceQuestionProps {
    question: string;
    choices: string[];
    correctAnswer: string;
    onAnswer: (isCorrect: boolean) => void;
}

const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({ question, choices, correctAnswer, onAnswer }) => {
    const [selectedChoice, setSelectedChoice] = useState<string>('');

    const handleChoiceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedChoice(event.target.value);
    };

    const handleSubmit = () => {
        if (onAnswer) {
            onAnswer(selectedChoice === correctAnswer);
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
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    sx={{ mt: 2 }} // MUI v5 syntax for margin-top
                >
                    Submit
                </Button>
            </FormControl>
        </div>
    );
};

export default MultipleChoiceQuestion;
