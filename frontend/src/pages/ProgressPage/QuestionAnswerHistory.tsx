import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

interface QuestionAnswer {
    question: string;
    answer: string;
}

const QuestionAnswerHistory = () => {
    const [history, setHistory] = React.useState<QuestionAnswer[]>([]);

    React.useEffect(() => {
        // Fetch the question and answer history from the backend
        const fetchHistory = async () => {
            try {
                const response = await fetch('/history');
                const data = await response.json();
                setHistory(data);
            } catch (error) {
                console.error("Error fetching history:", error);
            }
        };

        fetchHistory();
    }, []);

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    My Question and Answer History
                </Typography>
                {history.length > 0 ? (
                    history.map((item, index) => (
                        <div key={index}>
                            <Typography variant="body1">
                                <strong>Question:</strong> {item.question}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Answer:</strong> {item.answer}
                            </Typography>
                            <Divider sx={{ margin: '10px 0' }} />
                        </div>
                    ))
                ) : (
                    <Typography>No history available.</Typography>
                )}
            </CardContent>
        </Card>
    );
};

export default QuestionAnswerHistory;