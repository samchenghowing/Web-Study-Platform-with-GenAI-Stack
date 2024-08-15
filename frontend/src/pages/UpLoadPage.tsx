import * as React from 'react';
import FileUploader from './components/loader/FileUploader'; // Adjust the import path as needed
import InputFileUpload from './components/loader/Loader'; // Adjust the import path as needed
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export default function MainPage() {
    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Data Loading and File Upload
            </Typography>
            <FileUploader />
            <InputFileUpload />
        </Container>
    );
}
