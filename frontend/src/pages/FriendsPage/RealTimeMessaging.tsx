import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { TextField, Button, Typography, Divider } from '@mui/material';
import { useAuth } from '../../authentication/AuthContext';

export default function RealTimeMessaging() {
    const [messages, setMessages] = useState<string[]>([]);
    const [input, setInput] = useState<string>('');
    const { user } = useAuth();
    const ws = useRef<WebSocket | null>(null);

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
        <div>
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
        </div>
    );
}