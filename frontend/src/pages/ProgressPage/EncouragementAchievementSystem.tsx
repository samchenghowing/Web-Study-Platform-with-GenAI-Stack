import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import QuizIcon from '@mui/icons-material/Quiz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SchoolIcon from '@mui/icons-material/School';
import { styled } from '@mui/material/styles';

// Define color index for levels
const levelColors = {
    "Web Starter": "#e0f7fa",  // Light cyan
    "Web Beginner": "#b2ebf2", // Cyan
    "Web Learner": "#80deea",  // Medium cyan
    "Web Expert": "#4dd0e1",   // Darker cyan
    "Web Master": "#26c6da",   // Teal
    "Web God": "#00bcd4"       // Deep teal
};

// Custom styled card
const StyledCard = styled(Card)(({ theme }) => ({
    margin: '20px',
    boxShadow: theme.shadows[3],
}));

const EncouragementAchievementSystem = () => {
    // User Information
    const getUserInfo = () => ({
        name: "John Doe",
        id: "123456"
    });

    // Streak Rewards
    const getStreakRewards = () => {
        const streak = 5; // Demo streak in days
        return {
            streak,
            message: `You've completed quizzes for ${streak} consecutive days!`,
            hasMedal: streak >= 3 // Medal if streak >= 3 days
        };
    };

    // XP Points and Level
    const getLevelInfo = (xp) => {
        const levels = [
            { threshold: 0, title: "Web Starter" },
            { threshold: 500, title: "Web Beginner" },
            { threshold: 1000, title: "Web Learner" },
            { threshold: 2000, title: "Web Expert" },
            { threshold: 5000, title: "Web Master" },
            { threshold: 10000, title: "Web God" }
        ];

        let currentLevel = levels[0];
        let nextLevel = levels[1];
        for (let i = levels.length - 1; i >= 0; i--) {
            if (xp >= levels[i].threshold) {
                currentLevel = levels[i];
                nextLevel = levels[i + 1] || null;
                break;
            }
        }

        let progress = 0;
        if (nextLevel) {
            const xpInLevel = xp - currentLevel.threshold;
            const xpToNext = nextLevel.threshold - currentLevel.threshold;
            progress = (xpInLevel / xpToNext) * 100;
        } else {
            progress = 100; // Max level reached
        }

        return { xp, currentLevel, nextLevel, progress };
    };

    const getXP = () => 1200; // Demo XP

    // Achievement Badges
    const getAchievementBadges = () => {
        return [
            { title: "Quiz 7 days in a row", icon: <QuizIcon style={{ color: '#1976d2' }} /> },
            { title: "Get 100 questions right", icon: <CheckCircleIcon style={{ color: '#388e3c' }} /> },
            { title: "Master HTML Basics", icon: <SchoolIcon style={{ color: '#f57c00' }} /> }
        ];
    };

    // Fetch demo data
    const user = getUserInfo();
    const streakData = getStreakRewards();
    const xpData = getLevelInfo(getXP());
    const badges = getAchievementBadges();

    return (
        <StyledCard>
            <CardContent>
                {/* User Information */}
                <Typography variant="h5" gutterBottom color="primary">
                    User Profile
                </Typography>
                <Typography>Name: {user.name}</Typography>
                <Typography>ID: {user.id}</Typography>
                <Divider sx={{ margin: '10px 0' }} />

                {/* Streak */}
                <Typography variant="h6" gutterBottom color="secondary">
                    Streak
                </Typography>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    {streakData.hasMedal && (
                        <EmojiEventsIcon style={{ fontSize: 40, color: 'gold', marginRight: '10px' }} />
                    )}
                    <Typography>{streakData.message}</Typography>
                </div>
                <Divider sx={{ margin: '10px 0' }} />

                {/* XP and Level */}
                <Typography variant="h6" gutterBottom color="info.main">
                    XP and Level
                </Typography>
                <Typography>XP: {xpData.xp}</Typography>
                <Chip
                    label={`Level: ${xpData.currentLevel.title}`}
                    style={{
                        backgroundColor: levelColors[xpData.currentLevel.title] || '#e0e0e0',
                        margin: '10px 0',
                        fontWeight: 'bold',
                        color: '#000'
                    }}
                />
                {xpData.nextLevel ? (
                    <>
                        <LinearProgress
                            variant="determinate"
                            value={xpData.progress}
                            sx={{ margin: '10px 0', backgroundColor: '#e0e0e0', '& .MuiLinearProgress-bar': { backgroundColor: '#00bcd4' } }}
                        />
                        <Typography>
                            {xpData.progress.toFixed(0)}% to {xpData.nextLevel.title}
                        </Typography>
                    </>
                ) : (
                    <Typography>You've reached the highest level!</Typography>
                )}
                <Divider sx={{ margin: '10px 0' }} />

                {/* Achievements */}
                <Typography variant="h6" gutterBottom color="warning.main">
                    Achievements
                </Typography>
                <List>
                    {badges.map((badge, index) => (
                        <ListItem key={index}>
                            <ListItemIcon>{badge.icon}</ListItemIcon>
                            <ListItemText primary={badge.title} />
                        </ListItem>
                    ))}
                </List>
            </CardContent>
        </StyledCard>
    );
};

export default EncouragementAchievementSystem;