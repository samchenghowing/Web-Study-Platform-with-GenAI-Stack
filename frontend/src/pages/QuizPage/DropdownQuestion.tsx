// DropdownQuestion.tsx
import * as React from 'react';
import { useState } from 'react';
import { FormControl, InputLabel, MenuItem, Button } from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';


interface DropdownQuestionProps {
    question: string;
    choices: string[];
    correctAnswer: string;
    onAnswer: (isCorrect: boolean) => void;
}

const DropdownQuestion: React.FC<DropdownQuestionProps> = ({ question, choices, correctAnswer, onAnswer }) => {
    const [selectedChoice, setSelectedChoice] = useState<string>('');

    const handleChange = (event: SelectChangeEvent) => {
        setSelectedChoice(event.target.value as string);
    };

    const handleSubmit = () => {
        if (onAnswer) {
            onAnswer(selectedChoice === correctAnswer);
        }
    };

    return (
        <div style={{ padding: 20, maxWidth: 400, margin: '0 auto' }}>
            <FormControl fullWidth>
                <InputLabel>{question}</InputLabel>
                <Select
                    value={selectedChoice}
                    onChange={handleChange}
                >
                    {choices.map((choice, index) => (
                        <MenuItem key={index} value={choice}>
                            {choice}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
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

export default DropdownQuestion;
