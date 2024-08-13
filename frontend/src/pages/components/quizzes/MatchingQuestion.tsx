// MatchingQuestion.tsx
import * as React from 'react';
import { useState } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Button, Typography } from '@mui/material';

interface MatchingQuestionProps {
    question: string;
    items: string[];
    options: string[];
    correctMatches: Record<string, string>;
    onAnswer: (isCorrect: boolean) => void;
}

const MatchingQuestion: React.FC<MatchingQuestionProps> = ({ question, items, options, correctMatches, onAnswer }) => {
    const [matches, setMatches] = useState<Record<string, string>>({});

    const handleMatchChange = (item: string, match: string) => {
        setMatches(prev => ({ ...prev, [item]: match }));
    };

    const handleSubmit = () => {
        const isCorrect = Object.entries(matches).every(([item, match]) =>
            correctMatches[item] === match
        );
        if (onAnswer) {
            onAnswer(isCorrect);
        }
    };

    return (
        <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
            <Typography variant="h6">{question}</Typography>
            {items.map(item => (
                <div key={item}>
                    <Typography>{item}</Typography>
                    <Select
                        value={matches[item] || ''}
                        onChange={(e) => handleMatchChange(item, e.target.value as string)}
                        fullWidth
                    >
                        {options.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </Select>
                </div>
            ))}
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

export default MatchingQuestion;
