import * as React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';

export default function MainPage() {
    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                What do I learn?
            </Typography>

            <Divider />
        </Container>
    );
}
