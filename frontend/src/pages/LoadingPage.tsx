// src/pages/LoadingPage.tsx

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
            }}
        >
            <CircularProgress />
            <Typography variant="h6" sx={{ mt: 2 }}>
                Loading...
            </Typography>
        </Box>
    );
};

export default LoadingPage;
