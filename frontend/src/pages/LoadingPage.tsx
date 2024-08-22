import * as React from "react";
import { CircularProgress, Box, Typography } from '@mui/material';

const LoadingPage: React.FC = () => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: 'background.paper',
                padding: 3,
            }}
        >
            <CircularProgress color="primary" size={60} />
            <Typography
                variant="h6"
                sx={{ mt: 2 }}
                aria-live="polite"
            >
                Loading...
            </Typography>
        </Box>
    );
};

export default LoadingPage;
