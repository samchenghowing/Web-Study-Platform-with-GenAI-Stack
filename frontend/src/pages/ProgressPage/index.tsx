import * as React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';

export default function MainPage() {
    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                TODO: This show be a dash board page showing below
            </Typography>
            "Encouragement/ Achievement system"
            <Typography variant="h4" gutterBottom>
                My Score/ correct rate/ level
            </Typography>
            <Typography variant="h4" gutterBottom>
                My question and answer history
            </Typography>
            <Typography variant="h4" gutterBottom>
                My topics/ preference
            </Typography>
            <Divider />
        </Container>
    );
}
