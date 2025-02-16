import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { useAuth } from '../../authentication/AuthContext';

const CHAT_HISTORIES_API_ENDPOINT = 'http://localhost:8504/chat_histories/user';

interface ChatHistory {
    data: {
        content: string;
    };
    type: string;
}

interface SessionHistory {
    session_id: string;
    history: ChatHistory[];
}

const QuestionAnswerHistory = () => {
    const [history, setHistory] = React.useState<SessionHistory[]>([]);
    const { user } = useAuth();

    React.useEffect(() => {
        // Fetch the chat history from the backend
        const fetchHistory = async () => {
            try {
                const response = await fetch(`${CHAT_HISTORIES_API_ENDPOINT}/${user?._id}`);
                const data = await response.json();
                const formattedData = Object.keys(data).map(session_id => ({
                    session_id,
                    history: data[session_id]
                }));
                setHistory(formattedData);
            } catch (error) {
                console.error("Error fetching history:", error);
            }
        };

        fetchHistory();
    }, [user?._id]);

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    My Q & A History
                </Typography>
                {history.length > 0 ? (
                    history.map((session, index) => (
                        <div key={index}>
                            <Typography variant="h6">
                                Session ID: {session.session_id}
                            </Typography>
                            {session.history.map((item, idx) => (
                                <div key={idx}>
                                    <Typography variant="body1">
                                        <strong>Type:</strong> {item.type}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Content:</strong> {item.data.content}
                                    </Typography>
                                    <Divider sx={{ margin: '10px 0' }} />
                                </div>
                            ))}
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