import * as React from 'react';
import { useState, useEffect } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Divider, TextField, Button } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import { useAuth } from '../../authentication/AuthContext';

const friendsData = [
    { id: 1, name: 'Alice', age: 28, location: 'New York', hobbies: 'data structure, css' },
    { id: 2, name: 'Bob', age: 34, location: 'San Francisco', hobbies: 'html, javascript' },
    { id: 3, name: 'Charlie', age: 22, location: 'Chicago', hobbies: 'javascript' },
    { id: 4, name: 'Diana', age: 30, location: 'London', hobbies: 'css' },
];

export default function FriendsPage() {
    const [messages, setMessages] = useState<string[]>([]);
    const [input, setInput] = useState<string>('');
    const { user } = useAuth();
    const ws = React.useRef<WebSocket | null>(null);

    useEffect(() => {
        ws.current = new WebSocket(`ws://localhost:8504/ws/${user?._id}`);

        ws.current.onopen = () => {
            console.log('WebSocket connection opened');
        };

        ws.current.onmessage = (event) => {
            setMessages(prevMessages => [...prevMessages, event.data]);
        };

        ws.current.onclose = () => {
            console.log('WebSocket connection closed');
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [user?._id]);

    const sendMessage = () => {
        if (ws.current && input) {
            ws.current.send(user?.username + " said: " + input);
            setInput('');
        }
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Where are my friends?
            </Typography>
            <Divider sx={{ marginBottom: 2 }} />

            <Grid container spacing={3}>
                {friendsData.map(friend => (
                    <Grid item xs={12} sm={6} md={4} key={friend.id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">{friend.name}</Typography>
                                <Typography color="textSecondary">Age: {friend.age}</Typography>
                                <Typography color="textSecondary">Location: {friend.location}</Typography>
                                <Typography color="textSecondary">Hobbies: {friend.hobbies}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            <Divider sx={{ margin: 2 }} />

            <Typography variant="h5" gutterBottom>
                Real-time Messaging
            </Typography>
            <TextField
                label="Message"
                variant="outlined"
                fullWidth
                value={input}
                onChange={(e) => setInput(e.target.value)}
                sx={{ marginBottom: 2 }}
            />
            <Button variant="contained" color="primary" onClick={sendMessage}>
                Send
            </Button>

            <ul>
                {messages.map((message, index) => (
                    <li key={index}>{message}</li>
                ))}
            </ul>
        </Container>
    );
}