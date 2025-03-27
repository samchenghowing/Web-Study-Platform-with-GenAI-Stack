import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { useAuth } from '../../authentication/AuthContext';

const CHAT_HISTORIES_API_ENDPOINT = 'http://localhost:8504/chat_histories/user';

interface ChatHistory {
    data: { content: string };
    type: string | null;
}

interface SessionHistory {
    session_id: string;
    history: ChatHistory[];
}

const QuestionAnswerHistory = () => {
    const [history, setHistory] = React.useState<SessionHistory[]>([]);
    const [selectedSession, setSelectedSession] = React.useState<SessionHistory | null>(null);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const { user } = useAuth();

    React.useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch(`${CHAT_HISTORIES_API_ENDPOINT}/${user?._id}`);
                const data = await response.json();
                const formattedData = Object.keys(data).map(session_id => ({
                    session_id,
                    history: data[session_id].filter((item: ChatHistory) => item.data.content.trim() !== ''),
                }));
                setHistory(formattedData);
            } catch (error) {
                console.error("Error fetching history:", error);
            }
        };
        fetchHistory();
    }, [user?._id]);

    const handleSessionClick = (session: SessionHistory) => {
        setSelectedSession(session);
        setDialogOpen(true);
    };

    return (
        <div style={{ padding: '20px' }}>
            <Typography variant="h6" gutterBottom>
                My Session History (maybe merge to Lib page)
            </Typography>
            {history.length > 0 ? (
                history.map((session, index) => (
                    <Card
                        key={index}
                        onClick={() => handleSessionClick(session)}
                        sx={{ marginBottom: '10px', cursor: 'pointer', boxShadow: 2 }}
                    >
                        <CardContent>
                            <Typography variant="h6">
                                Session ID: {session.session_id.substring(0, 8)}...
                            </Typography>
                            <Typography variant="body2">
                                {session.history[0]?.data.content.substring(0, 100)}...
                            </Typography>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <Typography>No history available.</Typography>
            )}

            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="md"
                fullWidth
                aria-labelledby="session-dialog-title"
            >
                <DialogTitle id="session-dialog-title">
                    Session ID: {selectedSession?.session_id}
                </DialogTitle>
                <DialogContent sx={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    {selectedSession?.history.map((item, idx) => (
                        <div key={idx}>
                            <Typography variant="body1">
                                <strong>{idx % 2 === 0 ? 'Question:' : 'Answer:'}</strong>
                            </Typography>
                            <MarkdownRenderer content={item.data.content} />
                            <Divider sx={{ margin: '10px 0' }} />
                        </div>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default QuestionAnswerHistory;