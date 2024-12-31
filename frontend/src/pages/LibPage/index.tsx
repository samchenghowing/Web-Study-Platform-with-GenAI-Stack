import React, { useState, useEffect } from 'react';
import { Button, Container, Typography, List, ListItem, ListItemText, CircularProgress, Box } from '@mui/material';

import CreateSessionDialog from './CreateSessionDialog';
import SessionRecord from './SessionRecord';



const SessionPage: React.FC = () => {

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Welcome User! 
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