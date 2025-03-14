import * as React from 'react';
import { useState, useEffect } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Divider, TextField, Button } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Grid from '@mui/material/Grid';
import { useAuth } from '../../authentication/AuthContext';
import Avatar from '@mui/material/Avatar';

const LIST_ALL_USER = 'http://localhost:8504/users/all';
const CREATE_USER_FOLLOW = 'http://localhost:8504/users/relationship';
const DELETE_USER_FOLLOW = 'http://localhost:8504/users/relationship/delete';

interface User {
    id: string;
    username: string;
    relationships: {
        type: string;
        target: string;
        target_id: string;
    }[];
}

export default function FriendsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [messages, setMessages] = useState<string[]>([]);
    const [input, setInput] = useState<string>('');
    const { user } = useAuth();
    const ws = React.useRef<WebSocket | null>(null);
    const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);


    // WebSocket connection
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

    // Fetch all users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch(`${LIST_ALL_USER}`);
                const data = await response.json();
                setUsers(data.users || []);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };
        fetchUsers();
    }, []);

    const handleFollow = async (targetUserId: string) => {
        if (!user?._id) return;

        try {
            const response = await fetch(`${CREATE_USER_FOLLOW}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from_user_id: user._id,
                    to_user_id: targetUserId,
                    type: 'FOLLOWS'
                }),
            });

            if (response.ok) {
                // Get the target user's username
                const targetUser = users.find(u => u.id === targetUserId);
                
                // Update users list to reflect new relationship
                const updatedUsers = users.map(u => {
                    if (u.id === user._id) {
                        return {
                            ...u,
                            relationships: [
                                ...u.relationships,
                                {
                                    type: 'FOLLOWS',
                                    target: targetUser?.username || '',
                                    target_id: targetUserId
                                }
                            ]
                        };
                    }
                    return u;
                });
                setUsers(updatedUsers);
            }
        } catch (error) {
            console.error('Error following user:', error);
        }
    };

    const isFollowing = (targetUserId: string) => {
        const currentUser = users.find(u => u.id === user?._id);
        return currentUser?.relationships.some(
            r => r.type === 'FOLLOWS' && r.target_id === targetUserId
        );
    };

    const isMutualFollow = (targetUserId: string) => {
        const targetUser = users.find(u => u.id === targetUserId);
        return isFollowing(targetUserId) && targetUser?.relationships.some(
            r => r.type === 'FOLLOWS' && r.target_id === user?._id
        );
    };

    const handleUnfollow = async (targetUserId: string) => {
        if (!user?._id) return;
    
        try {
            const response = await fetch(`${DELETE_USER_FOLLOW}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from_user_id: user._id,
                    to_user_id: targetUserId,
                    type: 'FOLLOWS'
                }),
            });
    
            if (response.ok) {
                // Update users list to remove relationship
                const updatedUsers = users.map(u => {
                    if (u.id === user._id) {
                        return {
                            ...u,
                            relationships: u.relationships.filter(
                                r => !(r.type === 'FOLLOWS' && r.target_id === targetUserId)
                            )
                        };
                    }
                    return u;
                });
                setUsers(updatedUsers);
            }
        } catch (error) {
            console.error('Error unfollowing user:', error);
        }
    };

    // Add a function to generate a color from a string
    function stringToColor(string: string) {
        let hash = 0;
        let i;
      
        /* eslint-disable no-bitwise */
        for (i = 0; i < string.length; i += 1) {
          hash = string.charCodeAt(i) + ((hash << 5) - hash);
        }
      
        let color = '#';
      
        for (i = 0; i < 3; i += 1) {
          const value = (hash >> (i * 8)) & 0xff;
          color += `00${value.toString(16)}`.slice(-2);
        }
        /* eslint-enable no-bitwise */
      
        return color;
      }
      
      function stringAvatar(name: string) {
        return {
            sx: {
                bgcolor: stringToColor(name),
                width: 56,
                height: 56,
                marginBottom: 1
            },
            children: name
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
        };
    }

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Users and friend page
            </Typography>
            <Divider sx={{ marginBottom: 2 }} />

            <Grid container spacing={3}>
                {users.map(otherUser => (
                    user?._id !== otherUser.id && (
                        <Grid item xs={12} sm={6} md={4} key={otherUser.id}>
                            <Card
                                onMouseEnter={() => setHoveredUserId(otherUser.id)}
                                onMouseLeave={() => setHoveredUserId(null)}
                            >
                                <CardContent
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                    }}>
                                    <Avatar {...stringAvatar(otherUser.username)} />

                                    <Typography variant="h6">{otherUser.username}</Typography>
                                    {/* add other information of user here  like, study willing hobbies*/}
                                    {isMutualFollow(otherUser.id) ? (
                                        <Typography color="primary" variant="body2" sx={{ marginTop: 0 , marginBottom: 0}}>
                                            Following each other
                                        </Typography>
                                    ) : null}
                                </CardContent>
                                <CardActions>
                                    {isFollowing(otherUser.id) ? (
                                        <Button
                                            variant={hoveredUserId === otherUser.id ? "contained" : "outlined"}
                                            color={hoveredUserId === otherUser.id ? "error" : "primary"}
                                            onClick={() => handleUnfollow(otherUser.id)}
                                            fullWidth
                                        >
                                            {hoveredUserId === otherUser.id ? "Unfollow" : "Following"}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleFollow(otherUser.id)}
                                            fullWidth
                                        >
                                            Follow
                                        </Button>
                                    )}
                                </CardActions>
                            </Card>
                        </Grid>
                    )
                ))}
            </Grid>

            <Divider sx={{ margin: 2 }} />

            {/* Real-time messaging */}
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