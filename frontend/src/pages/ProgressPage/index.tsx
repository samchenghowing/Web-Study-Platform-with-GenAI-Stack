import * as React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import QuestionAnswerHistory from './QuestionAnswerHistory';

export default function MainPage() {
    return (
        <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom>
                Dashboard
            </Typography>
            <Divider sx={{ marginBottom: 2 }} />

            <Grid container spacing={3}>
                {/* Encouragement/Achievement System Card */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Encouragement / Achievement System
                            </Typography>
                            <Typography>
                                Here you can view your achievements and get motivation!
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Score / Correct Rate / Level Card */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                My Score / Correct Rate / Level
                            </Typography>
                            <Typography>
                                Current Score: 85<br />
                                Correct Rate: 90%<br />
                                Level: Expert
                            </Typography>
                        </CardContent>
                    </Card>
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