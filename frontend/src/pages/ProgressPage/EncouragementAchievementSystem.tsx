import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

const EncouragementAchievementSystem = () => {
    // Streak Rewards
    const getStreakRewards = () => {
        // Logic to calculate streak rewards
        return "You've completed quizzes for 5 consecutive days! Keep it up!";
    };

    // XP Points and Level Up
    const getXPPointsAndLevel = () => {
        // Logic to calculate XP points and level
        return {
            xp: 1200,
            level: "Intermediate"
        };
    };

    // Achievement Badges
    const getAchievementBadges = () => {
        // Logic to get achievement badges
        return [
            "Quiz 7 days in a row",
            "Get 100 questions right",
            "Master HTML Basics"
        ];
    };

    const xpData = getXPPointsAndLevel();
    const badges = getAchievementBadges();

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Streak Rewards
                </Typography>
                <Typography>
                    {getStreakRewards()}
                </Typography>
                <Typography variant="h6" gutterBottom>
                    XP Points and Level
                </Typography>
                <Typography>
                    XP: {xpData.xp}<br />
                    Level: {xpData.level}
                </Typography>
                <Typography variant="h6" gutterBottom>
                    Achievement Badges
                </Typography>
                <Typography>
                    {badges.join(", ")}
                </Typography>
            </CardContent>
        </Card>
    );
};

export default EncouragementAchievementSystem;
