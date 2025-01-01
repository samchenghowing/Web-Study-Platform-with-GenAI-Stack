import React, { useState, useEffect } from 'react';
import { Button, Container, Typography, List, ListItem, ListItemText, CircularProgress, Box } from '@mui/material';

import CreateSessionDialog from './CreateSessionDialog';
import SessionRecord from './SessionRecord';
import { useAuth } from '../../authentication/AuthContext';


const SessionPage: React.FC = () => {
    const { user } = useAuth();

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Welcome {user?.username}! 
            </Typography>
            <Typography variant="h6" gutterBottom>
                You can start learning by creating your Sessions!
            </Typography>
            
            <CreateSessionDialog  />
            <SessionRecord/>
        </Container>
    );
};

export default SessionPage;