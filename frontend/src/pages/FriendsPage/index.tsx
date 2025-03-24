import * as React from 'react';
import { useState, useEffect } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Divider, TextField, Button, Drawer, Box } from '@mui/material';
import { SystemStyleObject } from '@mui/system';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Grid from '@mui/material/Grid';
import { useAuth } from '../../authentication/AuthContext';
import Avatar from '@mui/material/Avatar';
import RealTimeMessaging from './RealTimeMessaging'; 
import MailIcon from '@mui/icons-material/Mail';
import { containerStyles } from '../../styles/commonStyles';
import { friendsPageStyles } from './styles';
import { SxProps } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { getAvatarPath } from '../../utils/avatarUtils';


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
    Time?: string;  
    Topic?: string;
    Knowledge?: string;
    avatar?: string; 
}

export default function FriendsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const { user } = useAuth();
    const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);
    const [isMessagingOpen, setIsMessagingOpen] = useState(false);
    const [targetUserId, setTargetUserId] = useState<string | null>(null);
    const [userAvatar, setUserAvatar] = useState<string | null>(null);

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

    // Knowledge Level Function
    const getKnowledgeLevel = (knowledge: string): { style: SxProps<Theme>; label: string } => {
        switch (knowledge) {
        case "I am a beginner":
            return { style: { backgroundColor: '#E3F2FD', color: '#1976D2' }, label: "Beginner" };
        case "I know some basic":
            return { style: { backgroundColor: '#E8F5E9', color: '#2E7D32' }, label: "Learner" };
        case "I have tried web editing":
            return { style: { backgroundColor: '#FFF3E0', color: '#E65100' }, label: "Expert" };
        case "I can discuss advance topic":
            return { style: { backgroundColor: '#EDE7F6', color: '#673AB7' }, label: "Master" };
        default:
            return { style: { backgroundColor: '#E3F2FD', color: '#1976D2' }, label: "Beginner" };
        }
    };
    
    // Study Time Function
    const getStudyTimeStyle = (time: string): { style: SxProps<Theme>; label: string } => {
        switch (time) {
        case "Less than 15 minutes":
            return { style: { backgroundColor: '#FCE4EC', color: '#C2185B' }, label: "Quick Learner" };
        case "Around 30 minutes":
            return { style: { backgroundColor: '#F3E5F5', color: '#7B1FA2' }, label: "Dedicated Learner" };
        case "More than 30 minutes":
            return { style: { backgroundColor: '#FFEBEE', color: '#C62828' }, label: "Passionate Learner" };
        default:
            return { style: { backgroundColor: '#F3E5F5', color: '#7B1FA2' }, label: "Learner" };
        }
    };

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

    return (
        <Container sx={containerStyles.pageContainer}>
            <Typography variant="h4" gutterBottom>
                Users and friend page
            </Typography>
            <Divider sx={{ marginBottom: 2 }} />

            <Grid container spacing={3}>
                {users.length > 1 ? (
                    users.map(otherUser => (
                        user?._id !== otherUser.id && (
                            <Grid item xs={12} sm={6} md={4} key={otherUser.id}>
                                <Card sx={friendsPageStyles.userCard.card}>
                                    <CardContent sx={friendsPageStyles.userCard.content}>

                                        <Avatar
                                            src={getAvatarPath(otherUser.avatar)}
                                            sx={{ 
                                                width: 80, 
                                                height: 80,
                                                bgcolor: !otherUser.avatar ? stringToColor(otherUser.username) : undefined 
                                            }}
                                        >
                                            {!otherUser.avatar && otherUser.username[0].toUpperCase()}
                                        </Avatar>
                                        <Typography variant="h6">{otherUser.username}</Typography>

                                        <Box sx={friendsPageStyles.userCard.infoSection}>
                                        {otherUser.Knowledge && (
                                            <Box sx={[
                                                friendsPageStyles.userCard.statusChip as SystemStyleObject<Theme>,
                                                getKnowledgeLevel(otherUser.Knowledge).style as SystemStyleObject<Theme>
                                                ]}>
                                                {getKnowledgeLevel(otherUser.Knowledge).label}
                                            </Box>
                                        )}
                                        {otherUser.Time && (
                                            <Box sx={[
                                                friendsPageStyles.userCard.statusChip as SystemStyleObject<Theme>,
                                                getStudyTimeStyle(otherUser.Time).style as SystemStyleObject<Theme>
                                                ]}>
                                                {getStudyTimeStyle(otherUser.Time).label}
                                            </Box>
                                        )}
                                        </Box>

                                        {isMutualFollow(otherUser.id) ? (
                                        <Typography color="primary" variant="body2">
                                            Following each other
                                        </Typography>
                                        ) : (
                                        <Typography color="primary" variant="body2">
                                            ‎
                                        </Typography>
                                        )}
                                        </CardContent>
                                        <CardActions sx={friendsPageStyles.actions}>
                                        {isFollowing(otherUser.id) ? (
                                            <Button
                                            onMouseEnter={() => setHoveredUserId(otherUser.id)}
                                            onMouseLeave={() => setHoveredUserId(null)}
                                            variant={hoveredUserId === otherUser.id ? "contained" : "outlined"}
                                            color={hoveredUserId === otherUser.id ? "error" : "primary"}
                                            onClick={() => handleUnfollow(otherUser.id)}
                                            sx={friendsPageStyles.followButton}
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
                                        <Button
                                            variant="outlined"
                                            color="secondary"
                                            onClick={() => {
                                            setTargetUserId(otherUser.id);
                                            setIsMessagingOpen(true);
                                            }}
                                            sx={friendsPageStyles.messageButton}
                                        >
                                            <MailIcon fontSize="small" />
                                        </Button>
                                        </CardActions>

                                </Card>
                            </Grid>
                        )
                    ))
                ) : (
                    <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="body1" color="textSecondary">
                            No other users found.
                        </Typography>
                    </Grid>
                )}
            </Grid>

            <Drawer
                anchor="right"
                open={isMessagingOpen}
                onClose={() => setIsMessagingOpen(false)}
            >
                <RealTimeMessaging targetUserId={targetUserId} />
            </Drawer>
        </Container>
    );
}