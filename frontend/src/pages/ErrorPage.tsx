import * as React from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { Typography, Container, Paper } from '@mui/material';

const ErrorPage: React.FC = () => {
    const error = useRouteError();
    console.error(error);

    let errorMessage: string;
    if (isRouteErrorResponse(error)) {
        // error is type `ErrorResponse`
        errorMessage = error.data.message || error.statusText;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    } else {
        console.error(error);
        errorMessage = 'Unknown error';
    }

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 8 }}>
            <Paper elevation={3} sx={{ padding: 4, textAlign: 'center' }}>
                <Typography variant="h4" color="error" gutterBottom>
                    Oops!
                </Typography>
                <Typography variant="h6" paragraph>
                    Sorry, an unexpected error has occurred.
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    <i>{errorMessage}</i>
                </Typography>
            </Paper>
        </Container>
    );
}

export default ErrorPage;
