import React, { useState, useEffect } from 'react';
import { Button, Container, Typography, List, ListItem, ListItemText, CircularProgress, Box } from '@mui/material';
import { useAuth } from '../../authentication/AuthContext';
import { useNavigate } from 'react-router-dom';
import CreateSessionDialog from './CreateSessionDialog';
import SessionRecord from './SessionRecord';

const SESSION_API_ENDPOINT = 'http://localhost:8504/sessions';
const CREATE_SESSION_API_ENDPOINT = 'http://localhost:8504/create_session';

interface Session {
    _id: string;
    title: string;
    status: 'created' | 'done';
}

const SessionPage: React.FC = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [openDialog, setOpenDialog] = useState<boolean>(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const response = await fetch(`${SESSION_API_ENDPOINT}/${user?._id}`);
            if (!response.ok) throw new Error('Failed to fetch sessions');
            const data = await response.json();
            setSessions(data.sessions);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSession = async () => {
        setOpenDialog(true);
    };

    const handleSessionSelect = (sessionId: string, status: 'created' | 'done') => {
        if (status === 'created') {
            navigate(`/quiz/${sessionId}`);
        } else {
            navigate(`/review/${sessionId}`);
        }
    };

    const handleSessionCreated = async () => {
        setOpenDialog(false);
        await fetchSessions();
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Your Sessions
            </Typography>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <List>
                    {sessions.map((session) => (
                        <ListItem 
                            key={session._id} 
                            button 
                            onClick={() => handleSessionSelect(session._id, session.status)}
                        >
                            <ListItemText primary={session.title} secondary={session.status === 'done' ? 'Completed' : 'In Progress'} />
                        </ListItem>
                    ))}
                </List>
            )}
            
            <CreateSessionDialog  />
            <SessionRecord/>
        </Container>
    );
};

export default SessionPage;