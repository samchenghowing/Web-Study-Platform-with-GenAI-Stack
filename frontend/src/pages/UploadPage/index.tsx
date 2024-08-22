import * as React from 'react';
import FileUploader from './FileUploader'; // Adjust the import path as needed
import InputFileUpload from './Loader'; // Adjust the import path as needed
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';

export default function MainPage() {
    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                File Upload
            </Typography>
            <FileUploader />

            <Divider />
            <Typography variant="h4" gutterBottom>
                Data Loading
            </Typography>
            <InputFileUpload />
        </Container>
    );
}
