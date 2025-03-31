import * as React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import QuestionAnswerHistory from './QuestionAnswerHistory';
import EncouragementAchievementSystem from './EncouragementAchievementSystem';

export default function MainPage() {
    return (
        <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom>
                Dashboard
            </Typography>
            <Divider sx={{ marginBottom: 2 }} />

            <Grid container spacing={3}>
                {/* Encouragement/Achievement System Card */}
                <Grid item xs={12}>
                    <EncouragementAchievementSystem />
                </Grid>

                {/* Question and Answer History Card */}
                <Grid item xs={12}>
                    <QuestionAnswerHistory />
                </Grid>

                {/* Topics / Preferences Card */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                My Topics / Preferences
                            </Typography>
                            <Typography>
                                You can customize your learning topics and preferences here.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
}