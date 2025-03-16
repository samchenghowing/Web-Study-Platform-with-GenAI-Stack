import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { TextField, Button, Typography, Divider } from '@mui/material';
import { useAuth } from '../../authentication/AuthContext';

interface RealTimeMessagingProps {
    targetUserId: string | null;
}

export default function RealTimeMessaging({ targetUserId }: RealTimeMessagingProps) {
    const [messages, setMessages] = useState<string[]>([]);
    const [input, setInput] = useState<string>('');
    const { user } = useAuth();
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!targetUserId || !user?._id) return;

        const token = localStorage.getItem('authToken'); // Retrieve the token from local storage
        const wsUrl = `ws://localhost:8504/ws/${user._id}/${targetUserId}`;

        // Custom WebSocket implementation to include headers
        class CustomWebSocket extends WebSocket {
            constructor(url: string, protocols?: string | string[]) {
                super(url, protocols);
            }

            setHeaders(headers: { [key: string]: string }) {
                this.headers = headers;
            }

            headers: { [key: string]: string } = {};
        }

        ws.current = new CustomWebSocket(wsUrl);
        (ws.current as CustomWebSocket).setHeaders({
            Authorization: `Bearer ${token}`
        });

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
    }, [targetUserId, user?._id]);

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