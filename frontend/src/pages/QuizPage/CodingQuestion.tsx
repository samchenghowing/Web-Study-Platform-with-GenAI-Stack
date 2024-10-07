// CodingQuestion.tsx
import * as React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import CodeMirrorMerge from 'react-codemirror-merge';
import { EditorView } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { useTheme } from '@mui/material/styles';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import { Button, Typography } from '@mui/material';

const SUBMIT_API_ENDPOINT = 'http://localhost:8504/submit';

const Original = CodeMirrorMerge.Original;
const Modified = CodeMirrorMerge.Modified;

interface CodingQuestionProps {
    question: string;
    correctAnswer: string; // TODO: Send to backend to evaluate the code
    onAnswer: (isCorrect: boolean) => void;
}

const CodingQuestion: React.FC<CodingQuestionProps> = ({ question, correctAnswer, onAnswer }) => {
    const [value, setValue] = React.useState("console.log('hello world!');");
    const [submissionUID, setSubmissionUID] = React.useState<string>('');

    const handleSubmit = async () => {
        // Fake correctness checking TODO
        const isCorrect = value.trim() === correctAnswer.trim();
        onAnswer(isCorrect);

        try {
            const response = await fetch(SUBMIT_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(value),
            });
            const json = await response.json();
            setSubmissionUID(json.uid);
        } catch (error) {
            console.error(error);
            // setSnackbarText("Quiz submission error");
            // setSnackbarOpen(true);
        } finally {
            // setSnackbarText("Quiz submitted and waiting for process");
            // setSnackbarOpen(true);
        }

    };

    const handleChange = (value: string) => {
        setValue(value);
    };

    return (
        <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
            <Typography variant="h6">{question}</Typography>
            <CodeMirror
                value={value}
                onChange={handleChange}
                extensions={[javascript({ jsx: true }), html(), css()]}
                theme={useTheme().palette.mode === 'light' ? githubLight : githubDark}
            />

            {submissionUID === '' ? (
                <CodeMirrorMerge orientation="b-a" theme={useTheme().palette.mode === 'light' ? githubLight : githubDark} >
                    <Original value={value} />
                    <Modified
                        value={value.replace(/t/g, 'T') + 'Six'}
                        extensions={[EditorView.editable.of(false), EditorState.readOnly.of(true)]}
                    />
                </CodeMirrorMerge>
            ) : null}

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

export default CodingQuestion;